import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { authRouter } from './modules/auth/routes';
import { ridesRouter } from './modules/rides/routes';
import { driversRouter } from './modules/drivers/routes';
import { adminRouter } from './modules/admin/routes';
import { errorHandler, HttpError } from './utils/errors';
import { asyncRoute } from './utils/asyncRoute';
import { logger } from './utils/logger';

export function createApp(prisma: PrismaClient) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(pinoHttp({ logger, redact: ['req.headers.authorization', 'req.headers.cookie'] }));

  app.get('/', (_request, response) => response.json({ name: 'RideX API', status: 'running' }));
  app.get('/api/health', asyncRoute(async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
      logger.warn({ err: error }, 'Database readiness check failed');
      response.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
  }));

  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter(prisma));
  app.use('/api/rides', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }), ridesRouter(prisma));
  app.use('/api/drivers', driversRouter(prisma));
  app.use('/api/admin', adminRouter(prisma));

  app.use((_request, _response, next) => next(new HttpError(404, 'Route not found', 'NOT_FOUND')));
  app.use(errorHandler);
  return app;
}
