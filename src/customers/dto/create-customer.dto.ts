import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Comercial ABC', description: 'Nombre del cliente' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: '123456-7', description: 'NIT o identificación fiscal' })
  @IsOptional()
  @IsString({ message: 'El NIT debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El NIT no puede exceder 100 caracteres' })
  taxId?: string;

  @ApiPropertyOptional({ example: 'cliente@example.com', description: 'Email del cliente' })
  @IsOptional()
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(150, { message: 'El email no puede exceder 150 caracteres' })
  email?: string;

  @ApiPropertyOptional({ example: '+502 1234-5678', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder 50 caracteres' })
  phone?: string;

  @ApiPropertyOptional({ example: 'María López', description: 'Persona de contacto' })
  @IsOptional()
  @IsString({ message: 'La persona de contacto debe ser una cadena de texto' })
  @MaxLength(150, { message: 'La persona de contacto no puede exceder 150 caracteres' })
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'Cliente con condiciones especiales', description: 'Notas adicionales' })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}
