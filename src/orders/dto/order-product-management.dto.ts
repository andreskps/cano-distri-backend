import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  Min 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddProductToOrderDto {
  @ApiProperty({ 
    description: 'ID del producto a añadir',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ 
    description: 'Cantidad del producto',
    example: 2
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ 
    description: 'Precio unitario personalizado (opcional, usa el precio del producto si no se especifica)',
    example: 25.99
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice?: number;
}

export class UpdateOrderProductDto {
  @ApiPropertyOptional({ 
    description: 'Nueva cantidad del producto',
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ 
    description: 'Nuevo precio unitario',
    example: 28.99
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice?: number;
}
