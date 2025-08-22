import {
  Controller,
  Put,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrderStatusService } from '../services/order-status.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ChangeOrderStatusDto, UpdatePaymentStatusDto } from '../dto/order-status.dto';
import { OrderStatusHistoryResponseDto } from '../dto/order-responses.dto';

@ApiTags('Estado de Pedidos')
@ApiBearerAuth('access-token')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Put(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Estado del pedido actualizado', type: OrderStatusHistoryResponseDto })
  async changeOrderStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updateStatusDto: ChangeOrderStatusDto,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.changeOrderStatus(orderId, updateStatusDto, user);
  }

  @Put(':id/pago')
  @ApiOperation({ summary: 'Actualizar estado del pago' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Estado del pago actualizado' })
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.updatePaymentStatus(orderId, updatePaymentDto, user);
  }

  @Get(':id/historial-estado')
  @ApiOperation({ summary: 'Obtener historial de estados del pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de estados del pedido',
    type: [OrderStatusHistoryResponseDto]
  })
  async getOrderStatusHistory(
    @Param('id', ParseUUIDPipe) orderId: string,
    @GetUser() user: User,
  ) {
    return this.orderStatusService.getOrderStatusHistory(orderId, user);
  }
}
