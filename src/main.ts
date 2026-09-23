import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService)

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(new ValidationPipe({
   whitelist: true,
   forbidNonWhitelisted: true,
   transform: true,
   transformOptions: { enableImplicitConversion: true }
  }))


  await app.listen(config.port)
}
await bootstrap();
