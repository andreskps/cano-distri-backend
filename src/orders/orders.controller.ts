import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { GetOrdersQueryDto, OrderResponseDto } from './dto/get-orders.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';

@ApiTags('Pedidos')
@ApiBearerAuth('access-token')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pedido creado exitosamente', 
    type: OrderResponseDto 
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.create(createOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Elementos por página' })
  @ApiQuery({ name: 'fecha', required: false, example: '2024-08-25', description: 'Filtrar por fecha de entrega' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado del pedido' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por cliente específico' })
  @ApiQuery({ name: 'codigo', required: false, example: 'PEDIDO-2024-001', description: 'Buscar por código de pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de pedidos con paginación',
    type: PaginatedResponseDto<OrderResponseDto>
  })
  async findAll(
    @Query() query: GetOrdersQueryDto,
    @GetUser() user: User,
  ): Promise<PaginatedResponseDto<Order>> {
    return this.ordersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles completos del pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalles del pedido', 
    type: OrderResponseDto 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Editar pedido (si aún no ha sido entregado)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pedido actualizado exitosamente', 
    type: OrderResponseDto 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar o cancelar un pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 204, description: 'Pedido cancelado exitosamente' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.ordersService.remove(id, user);
  }
}
