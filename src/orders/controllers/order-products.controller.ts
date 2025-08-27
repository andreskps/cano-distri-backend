import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrderProductsService } from '../services/order-products.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AddProductToOrderDto, UpdateOrderProductDto } from '../dto/order-product.dto';
import { OrderProductResponseDto } from '../dto/order-responses.dto';

@ApiTags('Products in Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderProductsController {
  constructor(private readonly orderProductsService: OrderProductsService) {}

  @Post(':orderId/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar producto al pedido' })
  @ApiParam({ name: 'orderId', description: 'ID del pedido' })
  @ApiResponse({ status: 201, description: 'Producto agregado al pedido', type: OrderProductResponseDto })
  async addProductToOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() addProductDto: AddProductToOrderDto,
    @GetUser() user: User,
  ) {
    return this.orderProductsService.addProductToOrder(orderId, addProductDto, user);
  }

  @Put(':pedidoId/productos/:productoId')
  @ApiOperation({ summary: 'Modificar cantidad/precio de producto en pedido' })
  @ApiParam({ name: 'pedidoId', description: 'ID del pedido' })
  @ApiParam({ name: 'productoId', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado en el pedido', type: OrderProductResponseDto })
  async updateOrderProduct(
    @Param('pedidoId', ParseUUIDPipe) orderId: string,
    @Param('productoId', ParseUUIDPipe) productId: string,
    @Body() updateDto: UpdateOrderProductDto,
    @GetUser() user: User,
  ) {
    return this.orderProductsService.updateOrderProduct(orderId, productId, updateDto, user);
  }

  @Delete(':pedidoId/productos/:productoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar producto del pedido' })
  @ApiParam({ name: 'pedidoId', description: 'ID del pedido' })
  @ApiParam({ name: 'productoId', description: 'ID del producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado del pedido' })
  async removeProductFromOrder(
    @Param('pedidoId', ParseUUIDPipe) orderId: string,
    @Param('productoId', ParseUUIDPipe) productId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.orderProductsService.removeProductFromOrder(orderId, productId, user);
  }
}
