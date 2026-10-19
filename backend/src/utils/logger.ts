import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' || process.env.RIDEX_INTEGRATION_TESTS === 'true'
    ? 'silent'
    : env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: { paths: ['password', 'passwordHash', 'authorization', 'accessToken'], censor: '[REDACTED]' },
  base: { service: 'ridex-api', environment: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});
