import { ApiProperty } from '@nestjs/swagger';
import { CustomerResponseDto } from './customer-response.dto';

export class PaginatedCustomerResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    example: { total: 100, page: 1, limit: 10, totalPages: 10, hasNextPage: true, hasPrevPage: false },
  })
  meta: any;
}
