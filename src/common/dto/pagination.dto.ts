import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Número de página (mínimo 1)', 
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Cantidad de elementos por página (entre 1 y 100)', 
    minimum: 1,
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Datos de la página actual' })
  data: T[];

  @ApiPropertyOptional({ example: 1, description: 'Página actual' })
  page: number;

  @ApiPropertyOptional({ example: 10, description: 'Elementos por página' })
  limit: number;

  @ApiPropertyOptional({ example: 5, description: 'Total de páginas' })
  totalPages: number;

  @ApiPropertyOptional({ example: 45, description: 'Total de elementos' })
  totalItems: number;

  @ApiPropertyOptional({ example: true, description: 'Tiene página siguiente' })
  hasNextPage: boolean;

  @ApiPropertyOptional({ example: false, description: 'Tiene página anterior' })
  hasPrevPage: boolean;
}
