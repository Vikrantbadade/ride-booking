import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

const enabled = process.env.RIDEX_INTEGRATION_TESTS === 'true';
const prisma = new PrismaClient();
const app = createApp(prisma);

const pickup = { address: 'Bandra West Station', latitude: 19.0596, longitude: 72.8295 };
const destination = { address: 'Andheri East Metro', latitude: 19.1136, longitude: 72.8697 };

test('PostgreSQL API integration: auth, ownership, booking, cancellation, completion, invoice, and idempotent dev payment', { skip: !enabled }, async () => {
  const email = `ridex-test-${randomUUID()}@example.test`;
  const otherEmail = `ridex-other-${randomUUID()}@example.test`;
  const driverEmail = `ridex-driver-${randomUUID()}@example.test`;
  const testPassword = 'integration-test-password-2026';
  const userIds: string[] = [];
  const rideIds: string[] = [];

  try {
    const registered = await request(app).post('/api/auth/register').send({
      name: 'RideX Integration Passenger', email, phone: `+199${Date.now().toString().slice(-9)}`, password: testPassword, role: 'PASSENGER',
    });
    assert.equal(registered.status, 201, JSON.stringify(registered.body));
    assert.equal(registered.body.user.role, 'PASSENGER');
    userIds.push(registered.body.user.id);
    const passengerToken = registered.body.accessToken as string;

    const login = await request(app).post('/api/auth/login').send({ email, password: testPassword });
    assert.equal(login.status, 200);
    const authenticated = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${passengerToken}`);
    assert.equal(authenticated.status, 200);
    assert.equal(authenticated.body.user.id, registered.body.user.id);

    const other = await request(app).post('/api/auth/register').send({
      name: 'Other Passenger', email: otherEmail, password: testPassword, role: 'PASSENGER',
    });
    assert.equal(other.status, 201);
    userIds.push(other.body.user.id);

    const driverRegistration = await request(app).post('/api/auth/register').send({
      name: 'Pending Test Driver', email: driverEmail, password: testPassword, role: 'DRIVER',
      vehicle: { type: 'economy', make: 'Test Motors', model: 'Test One', color: 'Blue', licensePlate: `TST${Date.now().toString().slice(-7)}` },
    });
    assert.equal(driverRegistration.status, 201, JSON.stringify(driverRegistration.body));
    assert.equal(driverRegistration.body.user.isVerified, false);
    userIds.push(driverRegistration.body.user.id);
    const pendingAvailability = await request(app).put('/api/drivers/me/availability')
      .set('Authorization', `Bearer ${driverRegistration.body.accessToken}`).send({ online: true });
    assert.equal(pendingAvailability.status, 403);
    assert.equal(pendingAvailability.body.code, 'DRIVER_NOT_VERIFIED');

    const cancelled = await request(app).post('/api/rides').set('Authorization', `Bearer ${passengerToken}`).send({ pickup, destination, rideType: 'economy' });
    assert.equal(cancelled.status, 201, JSON.stringify(cancelled.body));
    rideIds.push(cancelled.body.ride.id);
    assert.ok(['ACCEPTED', 'REQUESTED'].includes(cancelled.body.ride.status));
    const denied = await request(app).get(`/api/rides/${cancelled.body.ride.id}`).set('Authorization', `Bearer ${other.body.accessToken}`);
    assert.equal(denied.status, 404);
    const cancelResult = await request(app).post(`/api/rides/${cancelled.body.ride.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({ reason: 'Integration cancellation' });
    assert.equal(cancelResult.status, 200);
    assert.equal(cancelResult.body.ride.status, 'CANCELLED');

    const completed = await request(app).post('/api/rides').set('Authorization', `Bearer ${passengerToken}`).send({ pickup, destination, rideType: 'comfort' });
    assert.equal(completed.status, 201, JSON.stringify(completed.body));
    rideIds.push(completed.body.ride.id);
    const assignedDriverId = completed.body.ride.driver?.id as string | undefined;
    assert.ok(assignedDriverId, 'The development seed should provide an eligible driver');

    const driver = await prisma.driverProfile.findUnique({ where: { id: assignedDriverId }, include: { user: true } });
    assert.ok(driver);
    const driverLogin = await request(app).post('/api/auth/login').send({ email: driver.user.email, password: process.env.SEED_DEMO_PASSWORD });
    assert.equal(driverLogin.status, 200, JSON.stringify(driverLogin.body));
    const driverToken = driverLogin.body.accessToken as string;

    for (const status of ['ARRIVING', 'IN_PROGRESS', 'COMPLETED']) {
      const response = await request(app).patch(`/api/rides/${completed.body.ride.id}/status`)
        .set('Authorization', `Bearer ${driverToken}`).send({ status });
      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.ride.status, status);
    }

    const invoice = await request(app).get(`/api/rides/${completed.body.ride.id}/invoice`).set('Authorization', `Bearer ${passengerToken}`);
    assert.equal(invoice.status, 200);
    assert.match(invoice.body.invoice.invoiceNo, /^RX-/);

    const paymentBody = { method: 'upi', idempotencyKey: `integration-${randomUUID()}` };
    const payment = await request(app).post(`/api/rides/${completed.body.ride.id}/payments/development`)
      .set('Authorization', `Bearer ${passengerToken}`).send(paymentBody);
    assert.equal(payment.status, 200, JSON.stringify(payment.body));
    assert.equal(payment.body.payment.status, 'PAID');
    const replay = await request(app).post(`/api/rides/${completed.body.ride.id}/payments/development`)
      .set('Authorization', `Bearer ${passengerToken}`).send(paymentBody);
    assert.equal(replay.status, 200);
    assert.equal(replay.body.payment.id, payment.body.payment.id);

    const history = await request(app).get('/api/rides?limit=50').set('Authorization', `Bearer ${passengerToken}`);
    assert.equal(history.status, 200);
    assert.ok(history.body.rides.some((ride: { id: string }) => ride.id === completed.body.ride.id));
  } finally {
    await prisma.payment.deleteMany({ where: { rideId: { in: rideIds } } });
    await prisma.invoice.deleteMany({ where: { rideId: { in: rideIds } } });
    await prisma.ride.deleteMany({ where: { id: { in: rideIds } } });
    await prisma.authSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
});
