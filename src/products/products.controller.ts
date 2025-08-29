import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService, PaginatedResponse } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryParams, PaginationDto } from './dto/pagination.dto';
import { BulkUploadResponseDto } from './dto/bulk-upload-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from './entities/product.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedProductResponseDto } from './dto/paginated-product-response.dto';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden crear productos
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto (solo admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado', type: ProductResponseDto })
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ): Promise<Product> {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con filtros avanzados' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo de ordenamiento', enum: ['name', 'price', 'code', 'createdAt', 'costPrice', 'suggestedPrice'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Orden de clasificación', enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por estado activo/inactivo' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos', type: PaginatedProductResponseDto })
  async findAll(
    @Query() queryParams: ProductQueryParams,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAll(queryParams);
  }

  @Get('all-including-inactive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden ver productos inactivos
  @ApiOperation({ summary: 'Listar todos los productos incluyendo inactivos (solo admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada de todos los productos', type: PaginatedProductResponseDto })
  async findAllIncludingInactive(
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAllIncludingInactive(paginationDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden editar productos
  @ApiOperation({ summary: 'Actualizar un producto (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: ProductResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden eliminar productos
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto (soft delete, solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado (soft delete)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.productsService.remove(id, user);
  }

  @Post('bulk-upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden hacer carga masiva
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Carga masiva de productos desde Excel (solo admin)',
    description: `
    Carga múltiples productos desde un archivo Excel.
    
    **Formato del archivo:**
    - Debe ser un archivo .xlsx o .xls
    - Primera fila debe contener los encabezados
    - Columnas requeridas: name, code
    - Columnas opcionales: price, costPrice, unit, notes
    
    **Ejemplo de encabezados:**
    | name | code | price | costPrice | unit | notes |
    |------|------|-------|-----------|------|-------|
    | Coca Cola 600ml | CC-600 | 25.50 | 18.00 | unidad | Bebida gaseosa |
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la carga masiva', 
    type: BulkUploadResponseDto 
  })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<BulkUploadResponseDto> {
    return this.productsService.bulkUpload(file, user);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Buscar producto por código' })
  @ApiParam({ name: 'code', description: 'Código del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductResponseDto })
  async findByCode(
    @Param('code') code: string,
  ): Promise<Product | null> {
    return this.productsService.findByCode(code);
  }
}
