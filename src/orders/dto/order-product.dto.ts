import { IsString, IsInt, IsNumberString, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddProductToOrderDto {
  @ApiProperty({ example: 'uuid-product-123', description: 'ID del producto' })
  @IsString({ message: 'El ID del producto debe ser una cadena' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad del producto' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @ApiPropertyOptional({ example: '25.50', description: 'Precio unitario (opcional, se tomará del producto si no se especifica)' })
  @IsOptional()
  @IsNumberString({}, { message: 'El precio unitario debe ser un número válido' })
  unitPrice?: string;
}

export class UpdateOrderProductDto {
  @ApiPropertyOptional({ example: 3, description: 'Nueva cantidad del producto' })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity?: number;

  @ApiPropertyOptional({ example: '28.00', description: 'Nuevo precio unitario' })
  @IsOptional()
  @IsNumberString({}, { message: 'El precio unitario debe ser un número válido' })
  unitPrice?: string;
}
