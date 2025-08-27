import { IsOptional, IsPositive, IsInt, Min, Max, IsString, MaxLength, IsIn, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ProductQueryParams {
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

  @IsOptional()
  @IsIn(['name', 'price', 'code', 'createdAt', 'costPrice', 'suggestedPrice'], { 
    message: 'sortBy debe ser uno de: name, price, code, createdAt, costPrice, suggestedPrice' 
  })
  sortBy?: 'name' | 'price' | 'code' | 'createdAt' | 'costPrice' | 'suggestedPrice' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], { 
    message: 'sortOrder debe ser ASC o DESC' 
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}

// Exportar también el PaginationDto original para compatibilidad
export { PaginationDto } from '../../customers/dto/pagination.dto';
