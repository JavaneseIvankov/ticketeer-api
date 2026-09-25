import {
  INestApplication,
  RequestMethod,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AppHttpExceptionFilter } from '../src/common/filters/app-http-exception.filter.js';
import { ValidationException } from '../src/common/errors/validation.exception.js';

export async function createTestingApp(
  options: { cleanDb?: boolean } = { cleanDb: true },
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

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

  await app.init();

  if (options.cleanDb) {
    const dataSource = app.get(DataSource);
    await dataSource.query(`
      TRUNCATE TABLE tickets, orders, ticket_tiers, events, users CASCADE;
    `);
  }

  return app;
}
