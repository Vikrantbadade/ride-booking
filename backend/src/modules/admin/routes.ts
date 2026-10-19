import { DriverVerificationStatus, UserRole, type PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncRoute } from '../../utils/asyncRoute';
import { notFound } from '../../utils/errors';
import { env } from '../../config/env';

const verificationSchema = z.object({
  status: z.enum([DriverVerificationStatus.APPROVED, DriverVerificationStatus.REJECTED]),
  notes: z.string().trim().max(1000).optional(),
});

export function adminRouter(prisma: PrismaClient) {
  const router = Router();
  router.use(authenticate(prisma, env.JWT_SECRET), requireRole(UserRole.ADMIN));

  router.get('/drivers', asyncRoute(async (_request, response) => {
    const drivers = await prisma.driverProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }, vehicle: true, _count: { select: { rides: true } } },
      orderBy: { createdAt: 'asc' },
    });
    response.json({ drivers });
  }));

  router.patch('/drivers/:id/verification', validateBody(verificationSchema), asyncRoute(async (request, response) => {
    const driverId = z.string().min(1).max(64).parse(request.params.id);
    const result = await prisma.$transaction(async (tx) => {
      const driver = await tx.driverProfile.findUnique({ where: { id: driverId }, select: { id: true, verification: true } });
      if (!driver) throw notFound('Driver not found');
      const updated = await tx.driverProfile.update({ where: { id: driver.id }, data: { verification: request.body.status, ...(request.body.status === DriverVerificationStatus.REJECTED ? { online: false } : {}) } });
      await tx.adminAuditLog.create({
        data: {
          actorId: request.auth!.userId,
          action: 'DRIVER_VERIFICATION_UPDATED',
          targetType: 'DriverProfile',
          targetId: driver.id,
          details: { previousStatus: driver.verification, status: updated.verification, notes: request.body.notes ?? null },
        },
      });
      return updated;
    });
    response.json({ driver: result });
  }));

  return router;
}
