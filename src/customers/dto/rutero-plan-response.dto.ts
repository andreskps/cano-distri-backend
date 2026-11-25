import { ApiProperty } from '@nestjs/swagger';

export class RuteroPlanCustomerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() phone: string;
  @ApiProperty() contactPerson: string;
  @ApiProperty() address: string;
  @ApiProperty() city: string;

  @ApiProperty({ nullable: true, description: 'Día sugerido por historial de pedidos (1-7)' })
  suggestedDay: number | null;

  @ApiProperty({ description: 'true si aún no tiene día/orden guardado' })
  isSuggested: boolean;
}

export class RuteroPlanDayResponseDto {
  @ApiProperty({ nullable: true, description: '1 (lunes) a 7 (domingo); null = sin día' })
  dayOfWeek: number | null;

  @ApiProperty({ example: 'Lunes' })
  label: string;

  @ApiProperty({ type: [RuteroPlanCustomerDto] })
  customers: RuteroPlanCustomerDto[];
}

export class RuteroPlanResponse {
  @ApiProperty({ nullable: true, description: 'Enviar de vuelta al guardar' })
  version: string | null;

  @ApiProperty({ nullable: true })
  updatedAt: string | null;

  @ApiProperty({ nullable: true, description: 'Nombre de quien guardó por última vez' })
  updatedBy: string | null;

  @ApiProperty({ type: [RuteroPlanDayResponseDto] })
  days: RuteroPlanDayResponseDto[];
}
