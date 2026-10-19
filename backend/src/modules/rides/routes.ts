import { Router } from 'express';
import type { PrismaClient, RideStatus, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncRoute } from '../../utils/asyncRoute';
import { env } from '../../config/env';
import { notFound } from '../../utils/errors';
import { cancelRideSchema, createRideSchema, idParamsSchema, listQuerySchema, paymentSchema, statusSchema } from './schemas';
import { cancelRide, createRide, declineRide, getFareEstimate, getRide, listRides, retryRideMatch, updateRideStatus } from './service';
import { RideStatus as RideStatusEnum } from '@prisma/client';
import { assertRidePayable } from './policies';

export function ridesRouter(prisma: PrismaClient) {
  const router = Router();
  const auth = authenticate(prisma, env.JWT_SECRET);

  router.post('/estimate', validateBody(createRideSchema), asyncRoute(async (request, response) => {
    response.json({ estimate: getFareEstimate(request.body, env.ROAD_DISTANCE_FACTOR) });
  }));

  router.post('/', auth, requireRole('PASSENGER' as UserRole), validateBody(createRideSchema), asyncRoute(async (request, response) => {
    const ride = await createRide(prisma, request.auth!.userId, request.body);
    response.status(201).json({ ride });
  }));

  router.get('/', auth, asyncRoute(async (request, response) => {
    const query = listQuerySchema.parse(request.query);
    const rides = await listRides(prisma, { id: request.auth!.userId, role: request.auth!.role }, query.limit, query.status as RideStatus | undefined);
    response.json({ rides });
  }));

  router.get('/:id', auth, asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ ride: await getRide(prisma, id, { id: request.auth!.userId, role: request.auth!.role }) });
  }));

  router.post('/:id/match', auth, requireRole('PASSENGER' as UserRole), asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ ride: await retryRideMatch(prisma, id, request.auth!.userId) });
  }));

  router.post('/:id/cancel', auth, requireRole('PASSENGER' as UserRole), validateBody(cancelRideSchema), asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const ride = await cancelRide(prisma, id, request.auth!.userId, request.body.reason);
    response.json({ ride });
  }));

  router.patch('/:id/status', auth, requireRole('DRIVER' as UserRole), validateBody(statusSchema), asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const ride = await updateRideStatus(prisma, id, request.auth!.userId, request.body.status);
    response.json({ ride });
  }));

  router.post('/:id/decline', auth, requireRole('DRIVER' as UserRole), asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ ride: await declineRide(prisma, id, request.auth!.userId) });
  }));

  router.post('/:id/payments/development', auth, requireRole('PASSENGER' as UserRole), validateBody(paymentSchema), asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const ride = await prisma.ride.findFirst({ where: { id, passengerId: request.auth!.userId }, include: { invoice: true, payment: true } });
    if (!ride) throw notFound('Ride not found');
    assertRidePayable(ride.status, Boolean(ride.invoice), env.NODE_ENV);

    if (ride.payment?.status === 'PAID') {
      response.json({ payment: { id: ride.payment.id, status: ride.payment.status, amount: Number(ride.payment.amount), method: ride.payment.method, currency: ride.payment.currency, provider: ride.payment.provider }, invoice: ride.invoice });
      return;
    }

    const payment = await prisma.payment.upsert({
      where: { rideId: ride.id },
      create: {
        rideId: ride.id,
        amount: ride.finalFare ?? ride.estimatedFare,
        currency: env.FARE_CURRENCY,
        method: request.body.method,
        provider: 'development',
        providerRef: `dev_${request.body.idempotencyKey}`,
        idempotencyKey: request.body.idempotencyKey,
        status: 'PAID',
        paidAt: new Date(),
      },
      update: {
        method: request.body.method,
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    response.json({ payment: { id: payment.id, status: payment.status, amount: Number(payment.amount), method: payment.method, currency: payment.currency, provider: payment.provider }, invoice: ride.invoice });
  }));

  router.get('/:id/invoice', auth, asyncRoute(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const ride = await prisma.ride.findFirst({
      where: { id, passengerId: request.auth!.userId, status: RideStatusEnum.COMPLETED },
      include: { invoice: true },
    });
    if (!ride?.invoice) throw notFound('Invoice not found');
    response.json({ invoice: ride.invoice });
  }));

  return router;
}
