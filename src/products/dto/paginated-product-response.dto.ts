import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    example: { total: 50, page: 1, limit: 10, totalPages: 5, hasNextPage: true, hasPrevPage: false },
  })
  meta: any;
}
