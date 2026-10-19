import { Router } from 'express';
import { UserRole, type PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncRoute } from '../../utils/asyncRoute';
import { HttpError, notFound } from '../../utils/errors';
import { env } from '../../config/env';
import { availabilitySchema, locationSchema } from '../rides/schemas';
import { z } from 'zod';

const vehicleSchema = z.object({
  type: z.enum(['economy', 'comfort', 'premium', 'xl']),
  make: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(80),
  color: z.string().trim().min(2).max(50),
  licensePlate: z.string().trim().min(4).max(20).transform((value) => value.toUpperCase()),
});

export function driversRouter(prisma: PrismaClient) {
  const router = Router();
  const auth = authenticate(prisma, env.JWT_SECRET);

  router.get('/me', auth, requireRole(UserRole.DRIVER), asyncRoute(async (request, response) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: request.auth!.userId },
      include: { vehicle: true, _count: { select: { rides: true } } },
    });
    if (!profile) throw notFound('Driver profile not found');
    response.json({ profile });
  }));

  router.put('/me/availability', auth, requireRole(UserRole.DRIVER), validateBody(availabilitySchema), asyncRoute(async (request, response) => {
    const profile = await prisma.driverProfile.findUnique({ where: { userId: request.auth!.userId }, include: { vehicle: true } });
    if (!profile) throw notFound('Driver profile not found');
    if (request.body.online && profile.verification !== 'APPROVED') throw new HttpError(403, 'Driver verification is required before going online', 'DRIVER_NOT_VERIFIED');
    if (request.body.online && !profile.vehicle) throw new HttpError(403, 'Add vehicle details before going online', 'DRIVER_VEHICLE_REQUIRED');
    const updated = await prisma.driverProfile.update({ where: { id: profile.id }, data: { online: request.body.online } });
    response.json({ online: updated.online, verification: updated.verification });
  }));

  router.put('/me/vehicle', auth, requireRole(UserRole.DRIVER), validateBody(vehicleSchema), asyncRoute(async (request, response) => {
    const profile = await prisma.driverProfile.findUnique({ where: { userId: request.auth!.userId }, select: { id: true } });
    if (!profile) throw notFound('Driver profile not found');
    const vehicle = await prisma.$transaction(async (tx) => {
      await tx.driverProfile.update({ where: { id: profile.id }, data: { online: false, verification: 'PENDING' } });
      return tx.vehicle.upsert({
        where: { driverId: profile.id },
        create: { driverId: profile.id, ...request.body },
        update: request.body,
      });
    });
    response.json({ vehicle, verification: 'PENDING', online: false });
  }));

  router.put('/me/location', auth, requireRole(UserRole.DRIVER), validateBody(locationSchema), asyncRoute(async (request, response) => {
    const profile = await prisma.driverProfile.findUnique({ where: { userId: request.auth!.userId }, select: { id: true } });
    if (!profile) throw notFound('Driver profile not found');
    const activeRide = await prisma.ride.findFirst({
      where: { driverId: profile.id, status: { in: ['ACCEPTED', 'ARRIVING', 'IN_PROGRESS'] } },
      select: { id: true },
    });
    if (activeRide && request.body.rideId !== activeRide.id) throw new HttpError(403, 'Location updates must include your assigned active ride', 'ACTIVE_RIDE_REQUIRED');
    if (!activeRide && request.body.rideId) throw new HttpError(409, 'The specified ride is not currently active', 'RIDE_NOT_ACTIVE');
    const updated = await prisma.driverProfile.update({
      where: { id: profile.id },
      data: { latitude: request.body.latitude, longitude: request.body.longitude, locationUpdatedAt: new Date() },
      select: { locationUpdatedAt: true },
    });
    response.json({ updatedAt: updated.locationUpdatedAt });
  }));

  return router;
}
