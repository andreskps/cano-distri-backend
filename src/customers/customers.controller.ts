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
  ParseUUIDPipe
} from '@nestjs/common';
import { CustomersService, PaginatedResponse } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerQueryParams, PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginatedCustomerResponseDto } from './dto/paginated-customer-response.dto';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado', type: CustomerResponseDto })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetUser() user: User,
  ): Promise<Customer> {
    return this.customersService.create(createCustomerDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes con filtros avanzados' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo de ordenamiento', enum: ['name', 'email', 'phone', 'taxId', 'contactPerson', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Orden de clasificación', enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes', type: PaginatedCustomerResponseDto })
  async findAll(
    @Query() queryParams: CustomerQueryParams,
    @GetUser() user: User,
  ): Promise<PaginatedResponse<Customer>> {
    return this.customersService.findAll(queryParams, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado', type: CustomerResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Customer> {
    return this.customersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado', type: CustomerResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() user: User,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.customersService.remove(id, user);
  }

  @Get('by-seller/:sellerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden ver clientes de otros vendedores
  @ApiOperation({ summary: 'Obtener clientes por vendedor (solo admin)' })
  @ApiParam({ name: 'sellerId', description: 'ID del vendedor' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes del vendedor', type: PaginatedCustomerResponseDto })
  async findBySeller(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Customer>> {
    return this.customersService.findBySeller(sellerId, paginationDto);
  }

  // ==================== ENDPOINTS PARA DIRECCIONES ====================

  @Post(':customerId/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Añadir dirección a un cliente' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiResponse({ status: 201, description: 'Dirección creada' })
  async addAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() createAddressDto: CreateCustomerAddressDto,
    @GetUser() user: User,
  ): Promise<CustomerAddress> {
    return this.customersService.addAddress(customerId, createAddressDto, user);
  }

  @Get(':customerId/addresses')
  @ApiOperation({ summary: 'Obtener todas las direcciones de un cliente' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones del cliente' })
  async getCustomerAddresses(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @GetUser() user: User,
  ): Promise<CustomerAddress[]> {
    return this.customersService.getCustomerAddresses(customerId, user);
  }

  @Get(':customerId/addresses/:addressId')
  @ApiOperation({ summary: 'Obtener una dirección específica' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiParam({ name: 'addressId', description: 'ID de la dirección' })
  @ApiResponse({ status: 200, description: 'Dirección encontrada' })
  async getAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @GetUser() user: User,
  ): Promise<CustomerAddress> {
    return this.customersService.getAddress(customerId, addressId, user);
  }

  @Patch(':customerId/addresses/:addressId')
  @ApiOperation({ summary: 'Actualizar una dirección' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiParam({ name: 'addressId', description: 'ID de la dirección' })
  @ApiResponse({ status: 200, description: 'Dirección actualizada' })
  async updateAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateCustomerAddressDto,
    @GetUser() user: User,
  ): Promise<CustomerAddress> {
    return this.customersService.updateAddress(customerId, addressId, updateAddressDto, user);
  }

  @Delete(':customerId/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una dirección' })
  @ApiParam({ name: 'customerId', description: 'ID del cliente' })
  @ApiParam({ name: 'addressId', description: 'ID de la dirección' })
  @ApiResponse({ status: 204, description: 'Dirección eliminada' })
  async removeAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.customersService.removeAddress(customerId, addressId, user);
  }
}
