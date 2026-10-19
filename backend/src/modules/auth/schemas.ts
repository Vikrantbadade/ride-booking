import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  phone: z.string().trim().min(7).max(30).optional(),
  password: z.string().min(10).max(128),
  role: z.enum([UserRole.PASSENGER, UserRole.DRIVER]).default(UserRole.PASSENGER),
  vehicle: z.object({
    type: z.enum(['economy', 'comfort', 'premium', 'xl']).default('economy'),
    make: z.string().trim().min(2).max(80),
    model: z.string().trim().min(1).max(80),
    color: z.string().trim().min(2).max(50),
    licensePlate: z.string().trim().min(4).max(20).transform((value) => value.toUpperCase()),
  }).optional(),
}).superRefine((input, context) => {
  if (input.role === UserRole.DRIVER && !input.vehicle) {
    context.addIssue({ code: 'custom', path: ['vehicle'], message: 'Driver registration requires vehicle details' });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
