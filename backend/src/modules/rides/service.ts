import { Prisma, RideStatus, UserRole } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { RideInput } from './schemas';
import { estimateDistance, estimateFare } from './fare';
import { assertRideTransition } from './transitions';
import { assertRideCancellable } from './policies';
import { HttpError, notFound } from '../../utils/errors';

const rideInclude = {
  passenger: { select: { id: true, name: true, phone: true } },
  driver: { include: { user: { select: { id: true, name: true, phone: true } }, vehicle: true } },
  payment: true,
  invoice: true,
} satisfies Prisma.RideInclude;

export function serializeRide(ride: Prisma.RideGetPayload<{ include: typeof rideInclude }>) {
  return {
    id: ride.id,
    status: ride.status,
    rideType: ride.rideType,
    pickup: { address: ride.pickupAddress, latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
    destination: { address: ride.destinationAddress, latitude: ride.destinationLatitude, longitude: ride.destinationLongitude },
    passenger: ride.passenger,
    estimatedFare: Number(ride.estimatedFare),
    finalFare: ride.finalFare === null ? null : Number(ride.finalFare),
    estimatedDistance: ride.distanceKm,
    estimatedDuration: ride.estimatedDurationMins,
    distanceSource: ride.distanceSource,
    createdAt: ride.createdAt,
    startedAt: ride.startedAt,
    completedAt: ride.completedAt,
    cancellationReason: ride.cancellationReason,
    driver: ride.driver ? {
      id: ride.driver.id,
      name: ride.driver.user.name,
      phone: ride.driver.user.phone,
      verified: ride.driver.verification === 'APPROVED',
      location: !([RideStatus.ACCEPTED, RideStatus.ARRIVING, RideStatus.IN_PROGRESS] as RideStatus[]).includes(ride.status)
        || ride.driver.latitude === null || ride.driver.longitude === null
        ? null
        : { latitude: ride.driver.latitude, longitude: ride.driver.longitude, updatedAt: ride.driver.locationUpdatedAt },
      vehicle: ride.driver.vehicle ? [ride.driver.vehicle.make, ride.driver.vehicle.model].filter(Boolean).join(' ') || ride.driver.vehicle.type : null,
      vehicleColor: ride.driver.vehicle?.color ?? null,
      licensePlate: ride.driver.vehicle?.licensePlate ?? null,
    } : null,
    payment: ride.payment ? {
      status: ride.payment.status,
      method: ride.payment.method,
      amount: Number(ride.payment.amount),
      currency: ride.payment.currency,
    } : null,
    invoice: ride.invoice ? {
      invoiceNo: ride.invoice.invoiceNo,
      issuedAt: ride.invoice.issuedAt,
      subtotal: Number(ride.invoice.subtotal),
      total: Number(ride.invoice.total),
      currency: ride.invoice.currency,
      snapshot: ride.invoice.snapshot,
    } : null,
  };
}

export function getFareEstimate(input: RideInput, roadFactor?: number) {
  const distance = estimateDistance(input.pickup, input.destination, roadFactor);
  return {
    ...distance,
    rideType: input.rideType,
    estimatedFare: estimateFare(distance.distanceKm, input.rideType),
    currency: process.env.FARE_CURRENCY || 'INR',
  };
}

async function assignNearestDriver(tx: Prisma.TransactionClient, rideId: string, pickup: RideInput['pickup']) {
  const candidates = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT d."id"
    FROM "DriverProfile" AS d
    WHERE d."verification" = 'APPROVED'::"DriverVerificationStatus"
      AND d."online" = true
      AND d."latitude" IS NOT NULL
      AND d."longitude" IS NOT NULL
      AND EXISTS (SELECT 1 FROM "Vehicle" AS v WHERE v."driverId" = d."id")
      AND NOT EXISTS (
        SELECT 1 FROM "Ride" AS active_ride
        WHERE active_ride."driverId" = d."id"
          AND active_ride."status" IN ('ACCEPTED'::"RideStatus", 'ARRIVING'::"RideStatus", 'IN_PROGRESS'::"RideStatus")
      )
    ORDER BY POWER(d."latitude" - ${pickup.latitude}, 2)
      + POWER((d."longitude" - ${pickup.longitude}) * COS(RADIANS(${pickup.latitude})), 2)
    LIMIT 1
    FOR UPDATE OF d SKIP LOCKED
  `;
  const candidate = candidates[0];
  if (!candidate) return null;

  return tx.ride.update({
    where: { id: rideId, status: RideStatus.REQUESTED },
    data: { driverId: candidate.id, status: RideStatus.ACCEPTED, acceptedAt: new Date() },
    include: rideInclude,
  });
}

export async function retryRideMatch(prisma: PrismaClient, rideId: string, passengerId: string) {
  await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: { id: rideId, passengerId },
      select: { id: true, status: true, pickupLatitude: true, pickupLongitude: true, pickupAddress: true },
    });
    if (!ride) throw notFound('Ride not found');
    if (ride.status !== RideStatus.REQUESTED) throw new HttpError(409, 'Ride is no longer waiting for a driver', 'RIDE_NOT_MATCHABLE');
    await assignNearestDriver(tx, ride.id, { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude, address: ride.pickupAddress });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return getRide(prisma, rideId, { id: passengerId, role: UserRole.PASSENGER });
}

export async function declineRide(prisma: PrismaClient, rideId: string, driverUserId: string) {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.driverProfile.findUnique({ where: { userId: driverUserId }, select: { id: true } });
    if (!driver) throw notFound('Driver profile not found');
    const ride = await tx.ride.findFirst({ where: { id: rideId, driverId: driver.id }, select: { id: true, status: true } });
    if (!ride) throw notFound('Assigned ride not found');
    if (ride.status !== RideStatus.ACCEPTED) throw new HttpError(409, 'Only newly assigned rides can be declined', 'RIDE_NOT_DECLINABLE');
    await tx.ride.update({ where: { id: rideId }, data: { driverId: null, status: RideStatus.REQUESTED, acceptedAt: null } });
    const updated = await tx.ride.findUnique({ where: { id: rideId }, include: rideInclude });
    if (!updated) throw notFound('Ride not found');
    return serializeRide(updated);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createRide(prisma: PrismaClient, passengerId: string, input: RideInput) {
  const distance = estimateDistance(input.pickup, input.destination);
  const fare = estimateFare(distance.distanceKm, input.rideType);
  const rideId = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.create({
      data: {
        passengerId,
        rideType: input.rideType,
        pickupAddress: input.pickup.address,
        pickupLatitude: input.pickup.latitude,
        pickupLongitude: input.pickup.longitude,
        destinationAddress: input.destination.address,
        destinationLatitude: input.destination.latitude,
        destinationLongitude: input.destination.longitude,
        distanceKm: distance.distanceKm,
        estimatedDurationMins: distance.durationMinutes,
        distanceSource: distance.source,
        estimatedFare: fare,
      },
      select: { id: true },
    });
    await assignNearestDriver(tx, ride.id, input.pickup);
    return ride.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
  if (!ride) throw notFound('Ride was created but could not be reloaded');
  return serializeRide(ride);
}

export async function listRides(prisma: PrismaClient, actor: { id: string; role: UserRole }, limit: number, status?: RideStatus) {
  const where: Prisma.RideWhereInput = {
    ...(status ? { status } : {}),
    ...(actor.role === UserRole.PASSENGER ? { passengerId: actor.id } : {}),
    ...(actor.role === UserRole.DRIVER ? { driver: { userId: actor.id } } : {}),
  };
  const rides = await prisma.ride.findMany({ where, include: rideInclude, orderBy: { createdAt: 'desc' }, take: limit });
  return rides.map(serializeRide);
}

export async function getRide(prisma: PrismaClient, rideId: string, actor: { id: string; role: UserRole }) {
  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        ...(actor.role === UserRole.PASSENGER ? [{ passengerId: actor.id }] : []),
        ...(actor.role === UserRole.DRIVER ? [{ driver: { userId: actor.id } }] : []),
        ...(actor.role === UserRole.ADMIN ? [{ id: rideId }] : []),
      ],
    },
    include: rideInclude,
  });
  if (!ride) throw notFound('Ride not found');
  return serializeRide(ride);
}

export async function cancelRide(prisma: PrismaClient, rideId: string, passengerId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({ where: { id: rideId, passengerId }, select: { id: true, status: true } });
    if (!ride) throw notFound('Ride not found');
    assertRideCancellable(ride.status);
    await tx.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.CANCELLED, cancelledAt: new Date(), cancelledById: passengerId, cancellationReason: reason ?? null },
    });
    const updated = await tx.ride.findUnique({ where: { id: rideId }, include: rideInclude });
    if (!updated) throw notFound('Ride not found');
    return serializeRide(updated);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateRideStatus(prisma: PrismaClient, rideId: string, driverUserId: string, next: RideStatus) {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.driverProfile.findUnique({ where: { userId: driverUserId }, select: { id: true } });
    if (!driver) throw notFound('Driver profile not found');
    const ride = await tx.ride.findFirst({ where: { id: rideId, driverId: driver.id }, select: { id: true, status: true, estimatedFare: true, pickupAddress: true, destinationAddress: true } });
    if (!ride) throw notFound('Assigned ride not found');
    assertRideTransition(ride.status, next);

    const now = new Date();
    const data: Prisma.RideUpdateInput = next === RideStatus.ARRIVING
      ? { status: next }
      : next === RideStatus.IN_PROGRESS
        ? { status: next, startedAt: now }
        : { status: next, completedAt: now, finalFare: ride.estimatedFare };
    await tx.ride.update({ where: { id: ride.id }, data });

    if (next === RideStatus.COMPLETED) {
      const invoiceNo = `RX-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${ride.id.slice(-8).toUpperCase()}`;
      const fare = Number(ride.estimatedFare);
      await tx.invoice.create({
        data: {
          rideId: ride.id,
          invoiceNo,
          currency: process.env.FARE_CURRENCY || 'INR',
          subtotal: fare,
          total: fare,
          snapshot: { pickup: ride.pickupAddress, destination: ride.destinationAddress, finalFare: fare, completedAt: now.toISOString() },
        },
      });
      await tx.payment.upsert({ where: { rideId: ride.id }, create: { rideId: ride.id, amount: fare, currency: process.env.FARE_CURRENCY || 'INR' }, update: {} });
    }

    const updated = await tx.ride.findUnique({ where: { id: ride.id }, include: rideInclude });
    if (!updated) throw notFound('Ride not found');
    return serializeRide(updated);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
