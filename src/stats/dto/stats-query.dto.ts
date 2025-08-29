import { IsOptional, IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../orders/entities/order-status.enum';

export class StatsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Fecha de inicio para el filtro (YYYY-MM-DD)',
    example: '2025-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha de fin para el filtro (YYYY-MM-DD)',
    example: '2025-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por vendedor específico',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por cliente específico',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por estado de pedido',
    enum: OrderStatus
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ 
    description: 'Período predefinido (last7days, last30days, thisMonth, lastMonth, thisYear)',
    example: 'thisMonth'
  })
  @IsOptional()
  @IsString()
  period?: 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';
}
