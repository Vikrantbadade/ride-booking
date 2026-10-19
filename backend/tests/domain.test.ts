import assert from 'node:assert/strict';
import test from 'node:test';
import { RideStatus } from '@prisma/client';
import { estimateDistance, estimateFare } from '../src/modules/rides/fare';
import { assertRideTransition } from '../src/modules/rides/transitions';
import { assertRideCancellable, assertRidePayable } from '../src/modules/rides/policies';
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from '../src/modules/auth/service';
import { createApp } from '../src/app';
import type { PrismaClient, UserRole } from '@prisma/client';
import request from 'supertest';

const secret = process.env.JWT_SECRET!;
const pickup = { address: 'Origin', latitude: 19.0596, longitude: 72.8295 };
const destination = { address: 'Destination', latitude: 19.1136, longitude: 72.8697 };

test('distance and fare estimates explicitly expose adjusted straight-line source', () => {
  const estimate = estimateDistance(pickup, destination, 1.25);
  assert.ok(estimate.distanceKm > 0);
  assert.equal(estimate.source, 'straight_line_adjusted_estimate');
  assert.equal(estimate.durationMinutes, Math.max(1, Math.ceil(estimate.distanceKm / 25 * 60)));
  assert.equal(estimateFare(10, 'economy'), 92);
});

test('ride status transition rules reject invalid client transitions', () => {
  assert.doesNotThrow(() => assertRideTransition(RideStatus.ACCEPTED, RideStatus.ARRIVING));
  assert.doesNotThrow(() => assertRideTransition(RideStatus.IN_PROGRESS, RideStatus.COMPLETED));
  assert.throws(() => assertRideTransition(RideStatus.COMPLETED, RideStatus.IN_PROGRESS), { code: 'INVALID_RIDE_TRANSITION' });
});

test('cancellation is allowed only before a ride starts', () => {
  assert.doesNotThrow(() => assertRideCancellable(RideStatus.ACCEPTED));
  assert.throws(() => assertRideCancellable(RideStatus.IN_PROGRESS), { code: 'RIDE_NOT_CANCELLABLE' });
  assert.throws(() => assertRideCancellable(RideStatus.COMPLETED), { code: 'RIDE_NOT_CANCELLABLE' });
});

test('development payment cannot be simulated in production or before completion', () => {
  assert.doesNotThrow(() => assertRidePayable(RideStatus.COMPLETED, true, 'development'));
  assert.throws(() => assertRidePayable(RideStatus.COMPLETED, true, 'production'), { code: 'PAYMENT_PROVIDER_UNAVAILABLE' });
  assert.throws(() => assertRidePayable(RideStatus.IN_PROGRESS, false, 'development'), { code: 'RIDE_NOT_PAYABLE' });
});

test('passwords are hashed and JWT claims are verified', async () => {
  const hash = await hashPassword('a-strong-test-password');
  assert.notEqual(hash, 'a-strong-test-password');
  assert.equal(await verifyPassword('a-strong-test-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  const token = signAccessToken({ sub: 'user-1', role: 'PASSENGER' as UserRole, sid: 'session-1' }, secret);
  assert.deepEqual(verifyAccessToken(token, secret), { sub: 'user-1', role: 'PASSENGER', sid: 'session-1' });
  assert.throws(() => verifyAccessToken(token, 'x'.repeat(32)));
});

test('unauthenticated ride creation and cross-role admin access are rejected', async () => {
  const sessionId = 'session-passenger';
  const token = signAccessToken({ sub: 'passenger-1', role: 'PASSENGER' as UserRole, sid: sessionId }, secret);
  const fakePrisma = {
    authSession: {
      findUnique: async () => ({ id: sessionId, userId: 'passenger-1', revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { id: 'passenger-1', role: 'PASSENGER' } }),
    },
  } as unknown as PrismaClient;
  const app = createApp(fakePrisma);
  const noAuth = await request(app).post('/api/rides').send({ pickup, destination, rideType: 'economy' });
  assert.equal(noAuth.status, 401);
  const forbidden = await request(app).get('/api/admin/drivers').set('Authorization', `Bearer ${token}`);
  assert.equal(forbidden.status, 403);
});

test('registration rejects self-asserted administrator role', async () => {
  const app = createApp({} as PrismaClient);
  const response = await request(app).post('/api/auth/register').send({
    name: 'Not Admin', email: 'intruder@example.test', password: 'a-long-enough-password', role: 'ADMIN',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});
