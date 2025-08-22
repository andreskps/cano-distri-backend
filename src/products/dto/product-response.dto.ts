import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-product-123' })
  id: string;

  @ApiProperty({ example: 'Producto ABC' })
  name: string;

  @ApiProperty({ example: 'PRD-001' })
  code: string;

  @ApiProperty({ example: '25.50', nullable: true })
  price?: string | null;

  @ApiProperty({ example: '15.00', nullable: true })
  costPrice?: string | null;

  @ApiProperty({ example: '30.00', nullable: true })
  suggestedPrice?: string | null;

  @ApiProperty({ example: 'kg', nullable: true })
  unit?: string | null;

  @ApiProperty({ example: 'Notas del producto', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-08-22T12:00:00.000Z' })
  createdAt: Date;
}
