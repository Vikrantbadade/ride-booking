import type { NextFunction, Request, Response } from 'express';
import type { PrismaClient, UserRole } from '@prisma/client';
import { verifyAccessToken } from '../modules/auth/service';
import { HttpError } from '../utils/errors';

export function authenticate(prisma: PrismaClient, secret: string) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const authorization = request.header('authorization');
      const match = authorization?.match(/^Bearer\s+(.+)$/i);
      if (!match) throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED');

      const claims = verifyAccessToken(match[1]!, secret);
      const session = await prisma.authSession.findUnique({
        where: { id: claims.sid },
        include: { user: { select: { id: true, role: true } } },
      });
      if (!session || session.userId !== claims.sub || session.revokedAt || session.expiresAt <= new Date()) {
        throw new HttpError(401, 'Session expired or revoked', 'INVALID_SESSION');
      }
      if (session.user.role !== claims.role) throw new HttpError(401, 'Session role is no longer valid', 'INVALID_SESSION');

      request.auth = { userId: session.userId, role: session.user.role, sessionId: session.id };
      next();
    } catch (error) {
      next(error instanceof HttpError ? error : new HttpError(401, 'Invalid access token', 'INVALID_TOKEN'));
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) return next(new HttpError(401, 'Authentication required', 'UNAUTHENTICATED'));
    if (!roles.includes(request.auth.role)) return next(new HttpError(403, 'You do not have permission to perform this action', 'FORBIDDEN'));
    next();
  };
}
