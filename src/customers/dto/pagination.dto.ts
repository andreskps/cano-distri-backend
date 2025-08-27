import { IsOptional, IsPositive, IsInt, Min, Max, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @IsPositive({ message: 'La página debe ser un número positivo' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El término de búsqueda no puede exceder 255 caracteres' })
  search?: string;
}