import { env } from './config/env';
import { prisma } from './config/prisma';
import { createApp } from './app';
import { logger } from './utils/logger';

const app = createApp(prisma);
let server: ReturnType<typeof app.listen> | undefined;
let shuttingDown = false;

async function start() {
  await prisma.$connect();
  server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT }, 'RideX API listening');
  });
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down RideX API');
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  await prisma.$disconnect();
  clearTimeout(timeout);
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start().catch(async (error: unknown) => {
  logger.error({ err: error }, 'Failed to start RideX API');
  await prisma.$disconnect();
  process.exitCode = 1;
});
