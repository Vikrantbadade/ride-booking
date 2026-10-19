import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncRoute } from '../../utils/asyncRoute';
import { HttpError } from '../../utils/errors';
import { loginSchema, registerSchema } from './schemas';
import { login, register, revokeSession } from './service';

export function authRouter(prisma: PrismaClient) {
  const router = Router();
  const auth = authenticate(prisma, env.JWT_SECRET);

  router.post('/register', validateBody(registerSchema), asyncRoute(async (request, response) => {
    response.status(201).json(await register(prisma, request.body, env.JWT_SECRET));
  }));

  router.post('/login', validateBody(loginSchema), asyncRoute(async (request, response) => {
    response.json(await login(prisma, request.body.email, request.body.password, env.JWT_SECRET));
  }));

  router.post('/logout', auth, asyncRoute(async (request, response) => {
    await revokeSession(prisma, request.auth!.sessionId, request.auth!.userId);
    response.status(204).end();
  }));

  router.get('/me', auth, asyncRoute(async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, driverProfile: { select: { verification: true } } },
    });
    if (!user) throw new HttpError(401, 'Account no longer exists', 'INVALID_SESSION');
    response.json({ user: { ...user, role: user.role.toLowerCase(), isVerified: user.driverProfile?.verification === 'APPROVED' } });
  }));

  return router;
}
