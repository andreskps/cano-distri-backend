import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerAddressDto {
  @ApiProperty({ 
    example: '5ta Avenida 10-20, Zona 10', 
    description: 'Dirección completa del cliente' 
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MinLength(5, { message: 'La dirección debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'La dirección no puede exceder 500 caracteres' })
  address: string;

  @ApiPropertyOptional({ 
    example: 'Guatemala', 
    description: 'Ciudad' 
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
  city?: string;

  @ApiPropertyOptional({ 
    example: 'Guatemala', 
    description: 'Departamento o Estado' 
  })
  @IsOptional()
  @IsString({ message: 'El departamento debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El departamento no puede exceder 100 caracteres' })
  state?: string;

  @ApiPropertyOptional({ 
    example: '01001', 
    description: 'Código postal' 
  })
  @IsOptional()
  @IsString({ message: 'El código postal debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El código postal no puede exceder 20 caracteres' })
  postalCode?: string;

  @ApiPropertyOptional({ 
    example: 'Guatemala', 
    description: 'País' 
  })
  @IsOptional()
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  country?: string;
}
