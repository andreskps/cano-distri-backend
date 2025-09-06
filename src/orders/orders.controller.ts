import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Patch,
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
import { AddProductToOrderDto, UpdateOrderProductDto } from './dto/order-product-management.dto';
import { ChangeOrderStatusDto, UpdatePaymentStatusDto } from './dto/order-status.dto';
import { LogisticsQueryDto, LogisticsResponseDto } from './dto/logistics.dto';
import { OrderStatusService } from './services/order-status.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrderProduct } from './entities/order-product.entity';
import { Order } from './entities/order.entity';

@ApiTags('Pedidos')
@ApiBearerAuth('access-token')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderStatusService: OrderStatusService,
  ) {}

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

    // ==================== LOGÍSTICA Y CARGUE ====================

  @Get('logistica')
  @ApiOperation({ 
    summary: 'Obtener información de logística por fecha de entrega',
    description: 'Consolida productos y cantidades para una fecha específica de entrega. Útil para planificación logística y preparación de cargue.'
  })
  @ApiQuery({ 
    name: 'deliveryDate', 
    required: true, 
    description: 'Fecha de entrega (YYYY-MM-DD)', 
    example: '2025-09-06' 
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Filtrar por estado específico', 
    enum: ['pending', 'delivered', 'cancelled'] 
  })
  @ApiResponse({
    status: 200,
    description: 'Información de logística consolidada',
    type: LogisticsResponseDto,
  })
  async getLogisticsForDate(
    @Query() query: LogisticsQueryDto,
    @GetUser() user: User,
  ): Promise<LogisticsResponseDto> {
    return this.ordersService.getLogisticsForDate(query, user);
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

  // ==================== GESTIÓN DE PRODUCTOS EN ÓRDENES ====================

  @Post(':id/products')
  @ApiOperation({ summary: 'Añadir un producto a un pedido existente' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ 
    status: 201, 
    description: 'Producto añadido exitosamente al pedido',
    type: OrderProduct 
  })
  async addProductToOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() addProductDto: AddProductToOrderDto,
    @GetUser() user: User,
  ): Promise<OrderProduct> {
    return this.ordersService.addProductToOrder(orderId, addProductDto, user);
  }

  @Put(':id/products/:productId')
  @ApiOperation({ summary: 'Actualizar un producto específico de un pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiParam({ name: 'productId', description: 'ID del producto en el pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto del pedido actualizado exitosamente',
    type: OrderProduct 
  })
  async updateOrderProduct(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('productId', ParseUUIDPipe) orderProductId: string,
    @Body() updateProductDto: UpdateOrderProductDto,
    @GetUser() user: User,
  ): Promise<OrderProduct> {
    return this.ordersService.updateOrderProduct(orderId, orderProductId, updateProductDto, user);
  }

  @Delete(':id/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto de un pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiParam({ name: 'productId', description: 'ID del producto en el pedido' })
  @ApiResponse({ status: 204, description: 'Producto eliminado del pedido exitosamente' })
  async removeProductFromOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Param('productId', ParseUUIDPipe) orderProductId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.ordersService.removeProductFromOrder(orderId, orderProductId, user);
  }

  // ==================== PROXY: GESTIÓN DE ESTADOS (usa OrderStatusService) ====================

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado del pedido (proxy)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Estado del pedido actualizado' })
  async changeOrderStatusProxy(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() changeStatusDto: ChangeOrderStatusDto,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.changeOrderStatus(orderId, changeStatusDto, user);
  }

  @Patch(':id/payment')
  @ApiOperation({ summary: 'Actualizar estado del pago (proxy)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Estado del pago actualizado' })
  async updatePaymentStatusProxy(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.updatePaymentStatus(orderId, updatePaymentDto, user);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Obtener historial de estados del pedido (proxy)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Historial de estados del pedido' })
  async getOrderStatusHistoryProxy(
    @Param('id', ParseUUIDPipe) orderId: string,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.getOrderStatusHistory(orderId, user);
  }


}
