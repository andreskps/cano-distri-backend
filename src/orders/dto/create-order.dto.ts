import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsUUID, 
  IsArray, 
  ValidateNested, 
  IsDateString, 
  IsString, 
  IsOptional, 
  MinLength, 
  IsNumber, 
  Min, 
  IsPositive 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderProductDto {
  @ApiProperty({ example: 'uuid-del-producto', description: 'ID del producto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10, description: 'Cantidad del producto' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 25.50, description: 'Precio unitario personalizado (opcional)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-del-cliente', description: 'ID del cliente' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ 
    example: '2024-08-25', 
    description: 'Fecha de entrega programada (YYYY-MM-DD)' 
  })
  @IsDateString()
  deliveryDate: string;

  @ApiProperty({ example: 'uuid-del-direccion', description: 'ID de la dirección de entrega' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ 
    example: 'Entrega en horario de mañana', 
    description: 'Notas adicionales del pedido' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    type: [CreateOrderProductDto], 
    description: 'Lista de productos del pedido' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderProductDto)
  products: CreateOrderProductDto[];
}
