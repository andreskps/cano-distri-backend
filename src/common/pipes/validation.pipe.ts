import { ValidationPipe } from '@nestjs/common';

export const validationPipe = new ValidationPipe({
  whitelist: true, // Elimina propiedades que no están en el DTO
  forbidNonWhitelisted: true, // Rechaza requests con propiedades no permitidas
  transform: true, // Transforma tipos automáticamente
  transformOptions: {
    enableImplicitConversion: true, // Permite conversión implícita de tipos
  },
  errorHttpStatusCode: 422, // Código de estado para errores de validación
});
