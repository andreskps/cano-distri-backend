import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadErrorDto {
  @ApiProperty({ example: 2, description: 'Fila del Excel donde ocurrió el error' })
  row: number;

  @ApiProperty({ example: 'El código P001 ya existe', description: 'Descripción del error' })
  error: string;

  @ApiProperty({ 
    example: { name: 'Producto Test', code: 'P001', price: '25.50' }, 
    description: 'Datos del producto que causó el error' 
  })
  data: any;
}

export class BulkUploadResponseDto {
  @ApiProperty({ example: 15, description: 'Total de productos procesados' })
  totalProcessed: number;

  @ApiProperty({ example: 12, description: 'Productos creados exitosamente' })
  successCount: number;

  @ApiProperty({ example: 3, description: 'Productos con errores' })
  errorCount: number;

  @ApiProperty({ 
    type: [BulkUploadErrorDto], 
    description: 'Lista de errores encontrados' 
  })
  errors: BulkUploadErrorDto[];

  @ApiProperty({ 
    example: ['P001', 'P002', 'P003'], 
    description: 'Códigos de productos creados exitosamente' 
  })
  createdProducts: string[];
}
