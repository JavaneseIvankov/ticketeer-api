import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-helper.js';
import dotenv from 'dotenv';

dotenv.config({
  path: ['.env', '.env.local', '.env.test'],
});

describe('HealthCheck (e2e)', () => {
  let app: INestApplication;
  const isProd = process.env?.NODE_ENV === 'production';

  beforeAll(async () => {
    app = await createTestingApp({ cleanDb: !isProd });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health - harus mengembalikan status ok dan database up', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('database', 'up');
    expect(res.body).toHaveProperty('timestamp');
  });
});
