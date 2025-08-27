import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions, Or } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryParams, PaginationDto } from './dto/pagination.dto';
import { Product } from './entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';

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
}