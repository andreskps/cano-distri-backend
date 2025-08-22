import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './common/pipes/validation.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Aplicar pipe de validación global
  app.useGlobalPipes(validationPipe);

  // Aplicar filtro de excepciones global
  app.useGlobalFilters(new AllExceptionsFilter());

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  // Swagger/OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cano Distribuciones API')
    .setDescription('Documentación de la API de Cano Distribuciones')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
}
bootstrap();
