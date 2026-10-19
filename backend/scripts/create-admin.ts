import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.RIDEX_CONFIRM_ADMIN_BOOTSTRAP !== 'true') {
  throw new Error('Set RIDEX_CONFIRM_ADMIN_BOOTSTRAP=true to explicitly run the out-of-band administrator bootstrap.');
}
const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 14) {
  throw new Error('Provide ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (at least 14 characters) via the environment.');
}

const prisma = new PrismaClient();

async function main() {
  const email = ADMIN_EMAIL!.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: ADMIN_NAME!, passwordHash, role: UserRole.ADMIN },
    create: { name: ADMIN_NAME!, email, passwordHash, role: UserRole.ADMIN },
    select: { id: true, email: true, role: true },
  });
  console.info(`Administrator account provisioned out-of-band for ${user.email} (${user.id}).`);
}

main().catch((error: unknown) => {
  console.error('Administrator bootstrap failed:', error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
