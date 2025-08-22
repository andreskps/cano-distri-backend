import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from '../entities/order-status.enum';

export class GetOrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ 
    example: '2024-08-25', 
    description: 'Filtrar por fecha de entrega (YYYY-MM-DD)' 
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ 
    enum: OrderStatus, 
    description: 'Filtrar por estado del pedido' 
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  estado?: OrderStatus;

  @ApiPropertyOptional({ 
    example: 'uuid-del-cliente', 
    description: 'Filtrar por cliente específico' 
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ 
    example: 'PEDIDO-2024-001', 
    description: 'Buscar por código de pedido' 
  })
  @IsOptional()
  @IsString()
  codigo?: string;
}

export class OrderResponseDto {
  @ApiPropertyOptional({ example: 'uuid-del-pedido' })
  id: string;

  @ApiPropertyOptional({ example: 'PEDIDO-2024-001' })
  orderCode: string;

  @ApiPropertyOptional({ example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiPropertyOptional({ example: '2024-08-25T10:00:00Z' })
  deliveryDate: Date;

  @ApiPropertyOptional({ example: 125.50 })
  total: number;

  @ApiPropertyOptional({ example: false })
  isPaid: boolean;

  @ApiPropertyOptional({ example: 'Notas del pedido' })
  notes?: string;

  @ApiPropertyOptional({ example: '2024-08-22T15:30:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-08-22T15:30:00Z' })
  updatedAt: Date;

  // Relaciones
  customer?: {
    id: string;
    name: string;
    email: string;
  };

  seller?: {
    id: string;
    name: string;
    email: string;
  };

  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}
