import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestingApp } from './test-helper.js';

describe('Concurrency & War Tiket (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let eventId: string;
  let tierId: string;
  const customers: { token: string; id: string }[] = [];
  const successfulOrders: { customerId: string; orderId: string }[] = [];

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get(DataSource);

    const org = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `org_${Date.now()}@example.com`,
        password: 'password',
        fullName: 'Organizer',
        role: 'ORGANIZER',
      });

    const event = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${org.body.data.accessToken}`)
      .send({
        title: 'Foo Event',
        description: 'Testing concurrency',
        venue: 'The Venue',
        eventDate: '2028-12-31T20:00:00.000Z',
        tiers: [
          {
            name: 'Limited',
            price: 50000,
            totalQuota: 2,
            maxPerUser: 1,
            salesStart: '2020-01-01T00:00:00.000Z',
            salesEnd: '2029-01-01T00:00:00.000Z',
          },
        ],
      });

    eventId = event.body.data.id;
    tierId = event.body.data.tiers[0].id;

    for (let i = 1; i <= 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `cust_${i}_${Date.now()}@example.com`,
          password: 'password',
          fullName: `Customer ${i}`,
          role: 'CUSTOMER',
        });

      customers.push({
        token: res.body.data.accessToken,
        id: res.body.data.user.id,
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle race condition without overselling', async () => {
    const responses = await Promise.all(
      customers.map((c) =>
        request(app.getHttpServer())
          .post(`/api/v1/events/${eventId}/tiers/${tierId}/reserve`)
          .set('Authorization', `Bearer ${c.token}`)
          .send({ quantity: 1 }),
      ),
    );

    const success = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(success).toHaveLength(2);
    expect(conflicts).toHaveLength(3);

    for (const res of success) {
      expect(res.body.data.status).toBe('PENDING_PAYMENT');
      successfulOrders.push({
        customerId: res.body.data.customerId,
        orderId: res.body.data.id,
      });
    }

    // cek, quota harus tidak negative
    const [tier] = await dataSource.query(
      'SELECT "availableQuota" FROM ticket_tiers WHERE id = $1',
      [tierId],
    );
    expect(Number(tier.availableQuota)).toBe(0);
  });

  it('should restore quota when order is cancelled', async () => {
    const cancelled = successfulOrders[0];
    const buyer = customers.find((c) => c.id === cancelled.customerId)!;

    await request(app.getHttpServer())
      .delete(`/api/v1/orders/${cancelled.orderId}`)
      .set('Authorization', `Bearer ${buyer.token}`)
      .expect(200);

    const [tier] = await dataSource.query(
      'SELECT "availableQuota" FROM ticket_tiers WHERE id = $1',
      [tierId],
    );
    expect(Number(tier.availableQuota)).toBe(1);

    // setelah berhasil cancel order, salah satu customer dapat coba kembali dan harus berhasil
    const retryCustomer = customers.find(
      (c) => !successfulOrders.some((o) => o.customerId === c.id),
    )!;

    await request(app.getHttpServer())
      .post(`/api/v1/events/${eventId}/tiers/${tierId}/reserve`)
      .set('Authorization', `Bearer ${retryCustomer.token}`)
      .send({ quantity: 1 })
      .expect(201);

    const [updatedTier] = await dataSource.query(
      'SELECT "availableQuota" FROM ticket_tiers WHERE id = $1',
      [tierId],
    );
    expect(Number(updatedTier.availableQuota)).toBe(0);
  });

  it('should issue ticket upon successful payment', async () => {
    const order = successfulOrders[1];
    const buyer = customers.find((c) => c.id === order.customerId)!;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.orderId}/pay`)
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ paymentMethod: 'BANK_TRANSFER' }) // mock
      .expect(200);

    expect(res.body.data.status).toBe('PAID');

    const tickets = await dataSource.query(
      'SELECT * FROM tickets WHERE "orderId" = $1',
      [order.orderId],
    );
    expect(tickets).toHaveLength(1);
    expect(tickets[0].status).toBe('ISSUED');
  });
});
