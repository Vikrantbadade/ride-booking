import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateBody = (schema: ZodType): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse(request.body);
  if (!result.success) return next(result.error);
  request.body = result.data;
  next();
};

