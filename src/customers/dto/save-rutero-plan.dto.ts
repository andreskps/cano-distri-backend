import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RuteroPlanDayDto {
  @ApiProperty({ description: 'Día ISO 1 (lunes) a 7 (domingo); null = sin día', nullable: true, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number | null;

  @ApiProperty({ description: 'IDs de clientes en orden de visita', type: [String] })
  @IsArray()
  @ArrayMaxSize(10000)
  @IsUUID('all', { each: true })
  customerIds: string[];
}

export class SaveRuteroPlanDto {
  @ApiProperty({
    description: 'Versión recibida al cargar el rutero (evita sobrescribir cambios de otra persona)',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  version?: string | null;

  @ApiProperty({ type: [RuteroPlanDayDto] })
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => RuteroPlanDayDto)
  days: RuteroPlanDayDto[];
}
