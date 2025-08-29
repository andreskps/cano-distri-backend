import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions, Or } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryParams, PaginationDto } from './dto/pagination.dto';
import { BulkUploadResponseDto, BulkUploadErrorDto } from './dto/bulk-upload-response.dto';
import { Product } from './entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import * as XLSX from 'xlsx';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, user: User): Promise<Product> {
    // Solo administradores pueden crear productos
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear productos');
    }

    // Verificar si el código ya existe
    const existingProduct = await this.productRepository.findOne({
      where: { code: createProductDto.code },
    });

    if (existingProduct) {
      throw new ConflictException('Ya existe un producto con este código');
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(queryParams: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      isActive = true 
    } = queryParams;
    
    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<Product> = {
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      where: this.buildSearchConditions(search, isActive),
    };

    const [products, total] = await this.productRepository.findAndCount(queryOptions);
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User): Promise<Product> {
    // Solo administradores pueden editar productos
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden editar productos');
    }

    const product = await this.findOne(id);

    // Si se está actualizando el código, verificar que no exista
    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existingProduct = await this.productRepository.findOne({
        where: { code: updateProductDto.code },
      });

      if (existingProduct) {
        throw new ConflictException('Ya existe un producto con este código');
      }
    }

    await this.productRepository.update(id, updateProductDto);
    return await this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    // Solo administradores pueden eliminar productos
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar productos');
    }

    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Soft delete: marcar como inactivo
    await this.productRepository.update(id, { isActive: false });
  }

  async findByCode(code: string): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { code, isActive: true },
    });
  }

  async findAllIncludingInactive(paginationDto: PaginationDto, user: User): Promise<PaginatedResponse<Product>> {
    // Solo administradores pueden ver productos inactivos
    if (user.role !== UserRole.ADMIN) {
      // Convertir PaginationDto a ProductQueryParams para compatibilidad
      const queryParams: ProductQueryParams = {
        page: paginationDto.page,
        limit: paginationDto.limit,
        search: paginationDto.search,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        isActive: true
      };
      return this.findAll(queryParams);
    }

    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<Product> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      where: this.buildSearchConditions(search, undefined), // undefined para incluir todos
    };

    const [products, total] = await this.productRepository.findAndCount(queryOptions);
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Construye las condiciones de búsqueda para productos
   * @param search - Término de búsqueda opcional
   * @param isActive - Si filtrar por productos activos/inactivos o todos
   * @returns Condiciones para la consulta WHERE
   */
  private buildSearchConditions(search?: string, isActive?: boolean) {
    const baseWhere: any = {};
    
    // Agregar filtro de isActive si está definido
    if (isActive !== undefined) {
      baseWhere.isActive = isActive;
    }

    // Si no hay búsqueda, retornar solo el filtro de isActive
    if (!search || !search.trim()) {
      return baseWhere;
    }

    // Si hay búsqueda, crear condiciones OR para los campos disponibles
    const searchTerm = `%${search.trim()}%`;
    const searchConditions = [
      { ...baseWhere, name: ILike(searchTerm) },
      { ...baseWhere, code: ILike(searchTerm) },
      { ...baseWhere, notes: ILike(searchTerm) }, // Usar 'notes' en lugar de 'description'
    ];

    return searchConditions;
  }

  /**
   * Carga masiva de productos desde archivo Excel
   * @param file - Archivo Excel cargado
   * @param user - Usuario que realiza la carga
   * @returns Resultado de la carga masiva
   */
  async bulkUpload(file: Express.Multer.File, user: User): Promise<BulkUploadResponseDto> {
    // Solo administradores pueden hacer carga masiva
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden realizar carga masiva de productos');
    }

    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar que sea un archivo Excel
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
    }

    try {
      // Leer el archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        throw new BadRequestException('El archivo debe contener al menos una fila de datos además del encabezado');
      }

      // Validar encabezados esperados
      const headers = data[0] as string[];
      const expectedHeaders = ['name', 'code', 'price', 'costPrice', 'unit', 'notes'];
      const headerMap = this.validateAndMapHeaders(headers, expectedHeaders);

      const results: BulkUploadResponseDto = {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
        createdProducts: [],
      };

      // Obtener todos los códigos existentes para validación rápida
      const existingCodes = new Set(
        (await this.productRepository.find({ select: ['code'] })).map(p => p.code)
      );

      // Procesar cada fila de datos
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        results.totalProcessed++;

        try {
          const productData = this.parseRowData(row, headerMap, i + 1);
          
          // Validar código duplicado
          if (existingCodes.has(productData.code)) {
            throw new Error(`El código '${productData.code}' ya existe en la base de datos`);
          }

          // Verificar duplicados en el mismo archivo
          if (results.createdProducts.includes(productData.code)) {
            throw new Error(`El código '${productData.code}' está duplicado en el archivo`);
          }

          // Crear el producto
          const product = this.productRepository.create(productData);
          await this.productRepository.save(product);

          results.successCount++;
          results.createdProducts.push(productData.code);
          existingCodes.add(productData.code); // Añadir a la lista para futuras validaciones

        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: i + 1,
            error: error.message,
            data: this.safeParseRowData(row, headerMap),
          });
        }
      }

      return results;

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('Error procesando archivo Excel:', error);
      throw new BadRequestException('Error al procesar el archivo Excel. Verifique el formato.');
    }
  }

  /**
   * Valida y mapea los encabezados del Excel
   */
  private validateAndMapHeaders(headers: string[], expectedHeaders: string[]): Map<string, number> {
    const headerMap = new Map<string, number>();

    // Helper: normaliza un texto (quita acentos, pone en minúsculas y elimina caracteres no alfanuméricos)
    const normalize = (s?: string) =>
      (s || '')
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const normalizedHeaders = headers.map(h => normalize(h));

    // Sinónimos aceptados por cada campo (normalizados)
    const synonyms: Record<string, string[]> = {
      name: ['name', 'nombre'],
      code: ['code', 'codigo', 'codig o', 'codigo', 'código'.replace(/ó/g, 'o')],
      price: ['price', 'precio', 'precioventa', 'precioventa', 'precioventa'.replace(/[^a-z0-9]/g, '')],
      costPrice: ['costprice', 'cost_price', 'preciocosto', 'precio_costo', 'costo'],
      unit: ['unit', 'unidad'],
      notes: ['notes', 'notas', 'observaciones'],
    };

    // Normalizar los arrays de sinónimos
    const normSyn: Record<string, string[]> = {} as any;
    for (const key of Object.keys(synonyms)) {
      normSyn[key] = synonyms[key].map(n => normalize(n));
    }

    // Buscar índices para cada campo esperado usando sinónimos normalizados
    for (const expected of expectedHeaders) {
      const key = expected; // expected keys se corresponden con los del map
      const candidates = normSyn[key] || [normalize(expected)];

      const index = normalizedHeaders.findIndex(h => candidates.includes(h));
      if (index !== -1) {
        headerMap.set(expected, index);
      }
    }

    // Validar que al menos name y code estén presentes
    if (!headerMap.has('name') || !headerMap.has('code')) {
      throw new BadRequestException('El archivo debe contener al menos las columnas "name" y "code"');
    }

    return headerMap;
  }

  /**
   * Parsea una fila de datos del Excel
   */
  private parseRowData(row: any[], headerMap: Map<string, number>, rowNumber: number): CreateProductDto {
    const getValue = (key: string): any => {
      const index = headerMap.get(key);
      return index !== undefined ? row[index] : undefined;
    };

    const name = getValue('name')?.toString()?.trim();
    const code = getValue('code')?.toString()?.trim();
    
    if (!name) {
      throw new Error('El nombre del producto es requerido');
    }
    
    if (!code) {
      throw new Error('El código del producto es requerido');
    }

    const productData: CreateProductDto = {
      name,
      code,
      price: this.parsePrice(getValue('price')) || undefined,
      costPrice: this.parsePrice(getValue('costPrice')) || undefined,
      unit: getValue('unit')?.toString()?.trim() || undefined,
      notes: getValue('notes')?.toString()?.trim() || undefined,
    };

    return productData;
  }

  /**
   * Versión segura para parsear datos en caso de error
   */
  private safeParseRowData(row: any[], headerMap: Map<string, number>): any {
    try {
      return this.parseRowData(row, headerMap, 0);
    } catch {
      // Si falla el parseo, retornar los datos raw
      const result: any = {};
      headerMap.forEach((index, key) => {
        result[key] = row[index];
      });
      return result;
    }
  }

  /**
   * Parsea valores de precio desde Excel
   */
  private parsePrice(value: any): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
    
    if (isNaN(numValue)) {
      throw new Error(`Precio inválido: ${value}`);
    }

    if (numValue < 0) {
      throw new Error(`El precio no puede ser negativo: ${value}`);
    }

    return numValue.toFixed(2);
  }
}