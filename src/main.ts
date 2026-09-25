import {
  Logger,
  RequestMethod,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { ValidationException } from './common/errors/validation.exception.js';
import { AppHttpExceptionFilter } from './common/filters/app-http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.useGlobalFilters(new AppHttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationException(errors),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ticketeer API')
    .setDescription(
      'Event Booking Management Restful API Specification - PT DOT Indonesia Internship Challenge',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Format: Bearer <token>',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(config.port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application running on port ${config.port}`);
  logger.log(
    `API docs can be accessed in http://localhost:${config.port}/docs`,
  );
}
await bootstrap();
