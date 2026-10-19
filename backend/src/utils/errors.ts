import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Resource not found') => new HttpError(404, message, 'NOT_FOUND');

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({ error: 'Invalid request', code: 'VALIDATION_ERROR', details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ error: 'A record with those details already exists', code: 'CONFLICT' });
      return;
    }
    if (error.code === 'P2034') {
      response.status(409).json({ error: 'A concurrent update prevented this operation; retry the request', code: 'CONCURRENT_UPDATE' });
      return;
    }
  }
  response.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
};
