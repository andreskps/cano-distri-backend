import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class LogisticsQueryDto {
  @ApiProperty({ 
    description: 'Fecha de entrega para consultar (YYYY-MM-DD)',
    example: '2025-09-06'
  })
  @IsDateString()
  deliveryDate: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por estado específico',
    enum: OrderStatus,
    example: OrderStatus.PENDING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class ProductLogisticsDto {
  @ApiProperty({ description: 'ID del producto' })
  productId: string;

  @ApiProperty({ description: 'Nombre del producto', example: 'Coca Cola 600ml' })
  productName: string;

  @ApiProperty({ description: 'Código del producto', example: 'CC-600' })
  productCode: string;

  @ApiProperty({ description: 'Total de unidades requeridas', example: 150 })
  totalQuantity: number;

  @ApiProperty({ description: 'Número de órdenes que incluyen este producto', example: 8 })
  orderCount: number;

  @ApiProperty({ description: 'Precio unitario promedio', example: 25.50 })
  averagePrice: number;

  @ApiProperty({ description: 'Valor total de este producto', example: 3825.00 })
  totalValue: number;

  @ApiProperty({ description: 'Unidad de medida', example: 'unidad', required: false })
  unit?: string;
}

export class OrderLogisticsDto {
  @ApiProperty({ description: 'ID de la orden' })
  orderId: string;

  @ApiProperty({ description: 'Código de la orden', example: 'ORD-2025-001' })
  orderCode: string;

  @ApiProperty({ description: 'Nombre del cliente', example: 'Supermercado La Esquina' })
  customerName: string;

  @ApiProperty({ description: 'Dirección de entrega', required: false })
  deliveryAddress?: string;

  @ApiProperty({ description: 'Total de la orden', example: 450.75 })
  orderTotal: number;

  @ApiProperty({ description: 'Estado de la orden', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Notas de la orden', required: false })
  notes?: string;

  @ApiProperty({ description: 'Productos en esta orden', type: [ProductLogisticsDto] })
  products: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export class LogisticsResponseDto {
  @ApiProperty({ description: 'Fecha de entrega consultada' })
  deliveryDate: string;

  @ApiProperty({ description: 'Resumen de productos consolidados', type: [ProductLogisticsDto] })
  consolidatedProducts: ProductLogisticsDto[];

  @ApiProperty({ description: 'Detalle de órdenes para esta fecha', type: [OrderLogisticsDto] })
  orders: OrderLogisticsDto[];

  @ApiProperty({ description: 'Resumen general' })
  summary: {
    totalOrders: number;
    totalProducts: number;
    totalValue: number;
    uniqueProducts: number;
  };
}
