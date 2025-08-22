import { IsString, IsOptional, MinLength, MaxLength, IsNumberString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Producto ABC', description: 'Nombre del producto' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'PRD-001', description: 'Código único del producto' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MinLength(1, { message: 'El código es requerido' })
  code: string;

  @ApiPropertyOptional({ example: '25.50', description: 'Precio de venta' })
  @IsOptional()
  @IsNumberString({}, { message: 'El precio debe ser un número válido' })
  price?: string;

  @ApiPropertyOptional({ example: '15.00', description: 'Precio de costo' })
  @IsOptional()
  @IsNumberString({}, { message: 'El precio de costo debe ser un número válido' })
  costPrice?: string;

  @ApiPropertyOptional({ example: '30.00', description: 'Precio sugerido' })
  @IsOptional()
  @IsNumberString({}, { message: 'El precio sugerido debe ser un número válido' })
  suggestedPrice?: string;

  @ApiPropertyOptional({ example: 'kg', description: 'Unidad de medida' })
  @IsOptional()
  @IsString({ message: 'La unidad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La unidad no puede exceder 50 caracteres' })
  unit?: string;

  @ApiPropertyOptional({ example: 'Producto de calidad premium', description: 'Notas adicionales' })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Si el producto está activo' })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;
}
