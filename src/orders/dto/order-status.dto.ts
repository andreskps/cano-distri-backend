import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class ChangeOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.DELIVERED, description: 'Nuevo estado del pedido' })
  @IsEnum(OrderStatus, { message: 'El estado debe ser válido' })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Entregado al cliente', description: 'Notas sobre el cambio de estado' })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: true, description: 'Estado de pago del pedido' })
  @IsBoolean({ message: 'El estado de pago debe ser verdadero o falso' })
  isPaid: boolean;

  @ApiPropertyOptional({ example: 'Pago recibido en efectivo', description: 'Notas sobre el pago' })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}
