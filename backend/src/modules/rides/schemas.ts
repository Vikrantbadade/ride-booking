import { RideStatus } from '@prisma/client';
import { z } from 'zod';

const coordinateSchema = z.object({
  address: z.string().trim().min(2).max(240),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const estimateSchema = z.object({
  pickup: coordinateSchema,
  destination: coordinateSchema,
  rideType: z.enum(['economy', 'comfort', 'premium', 'xl']).default('economy'),
});

export const createRideSchema = estimateSchema;
export const idParamsSchema = z.object({ id: z.string().min(1).max(64) });

export const cancelRideSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const statusSchema = z.object({
  status: z.enum([RideStatus.ARRIVING, RideStatus.IN_PROGRESS, RideStatus.COMPLETED]),
});

export const paymentSchema = z.object({
  method: z.enum(['upi', 'card', 'wallet', 'cash']),
  idempotencyKey: z.string().min(8).max(128),
});

export const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  rideId: z.string().min(1).max(64).optional(),
});

export const availabilitySchema = z.object({ online: z.boolean() });

export const listQuerySchema = z.object({
  status: z.nativeEnum(RideStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type RideInput = z.infer<typeof createRideSchema>;
