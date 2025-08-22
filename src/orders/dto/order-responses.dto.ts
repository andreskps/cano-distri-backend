import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class OrderProductResponseDto {
  @ApiProperty({ example: 'uuid-order-product-123' })
  id: string;

  @ApiProperty({ example: 'uuid-product-123' })
  productId: string;

  @ApiProperty({ example: 'Producto ABC' })
  productName: string;

  @ApiProperty({ example: 'PRD-001' })
  productCode: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '25.50' })
  unitPrice: string;

  @ApiProperty({ example: '51.00' })
  subtotal: string;

  @ApiProperty({ example: '2025-08-22T12:00:00.000Z' })
  createdAt: Date;
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty({ example: 'uuid-history-123' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.DELIVERED })
  status: OrderStatus;

  @ApiProperty({ example: '2025-08-22T12:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 'Entregado al cliente', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: 'uuid-user-123', nullable: true })
  userId?: string | null;

  @ApiProperty({ example: 'Juan Pérez', nullable: true })
  userName?: string | null;
}
