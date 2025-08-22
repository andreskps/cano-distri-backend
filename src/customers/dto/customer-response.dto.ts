import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class CustomerResponseDto {
  @ApiProperty({ example: 'uuid-client-123' })
  id: string;

  @ApiProperty({ example: 'Comercial ABC' })
  name: string;

  @ApiProperty({ example: '123456-7', nullable: true })
  taxId?: string | null;

  @ApiProperty({ example: 'cliente@example.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: '+502 1234-5678', nullable: true })
  phone?: string | null;

  @ApiProperty({ example: 'María López', nullable: true })
  contactPerson?: string | null;

  @ApiProperty({ example: 'Notas', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2025-08-22T12:00:00.000Z' })
  createdAt: Date;
}
