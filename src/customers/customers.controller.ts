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
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Customer } from './entities/customer.entity';
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
  @ApiOperation({ summary: 'Listar clientes del usuario actual' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes', type: PaginatedCustomerResponseDto })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<PaginatedResponse<Customer>> {
    return this.customersService.findAll(paginationDto, user);
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
  async findBySeller(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Customer>> {
    return this.customersService.findBySeller(sellerId, paginationDto);
  }
}
