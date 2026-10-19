import 'dotenv/config';
import { PrismaClient, UserRole, DriverVerificationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

if (process.env.NODE_ENV !== 'development') {
  throw new Error('Demo seed is development-only. Set NODE_ENV=development explicitly.');
}
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? '';
if (demoPassword.length < 10) {
  throw new Error('Set SEED_DEMO_PASSWORD to a local demo password of at least 10 characters.');
}

const prisma = new PrismaClient();
const drivers = [
  { email: 'demo.driver.one@example.test', name: 'Arjun Sharma', phone: '+919876543210', latitude: 19.076, longitude: 72.8777, vehicleType: 'comfort', make: 'Toyota', model: 'Camry', color: 'White', licensePlate: 'DEMO-RX-001' },
  { email: 'demo.driver.two@example.test', name: 'Priya Patel', phone: '+918765432109', latitude: 19.082, longitude: 72.88, vehicleType: 'economy', make: 'Honda', model: 'City', color: 'Silver', licensePlate: 'DEMO-RX-002' },
];

async function main() {
  const passwordHash = await hash(demoPassword, 12);
  for (const demo of drivers) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { name: demo.name, phone: demo.phone, passwordHash, role: UserRole.DRIVER },
      create: {
        name: demo.name,
        email: demo.email,
        phone: demo.phone,
        passwordHash,
        role: UserRole.DRIVER,
        driverProfile: {
          create: {
            verification: DriverVerificationStatus.APPROVED,
            online: true,
            latitude: demo.latitude,
            longitude: demo.longitude,
            locationUpdatedAt: new Date(),
            vehicle: { create: { type: demo.vehicleType, make: demo.make, model: demo.model, color: demo.color, licensePlate: demo.licensePlate } },
          },
        },
      },
      include: { driverProfile: { include: { vehicle: true } } },
    });
    const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (!driverProfile) throw new Error(`Could not create demo driver profile: ${demo.email}`);
    await prisma.driverProfile.update({
      where: { userId: user.id },
      data: { verification: DriverVerificationStatus.APPROVED, online: true, latitude: demo.latitude, longitude: demo.longitude, locationUpdatedAt: new Date() },
    });
    await prisma.vehicle.upsert({
      where: { driverId: driverProfile.id },
      update: { type: demo.vehicleType, make: demo.make, model: demo.model, color: demo.color, licensePlate: demo.licensePlate },
      create: { driverId: driverProfile.id, type: demo.vehicleType, make: demo.make, model: demo.model, color: demo.color, licensePlate: demo.licensePlate },
    });
  }
  console.info(`Seeded ${drivers.length} verified demo drivers (development only).`);
}

main().catch((error: unknown) => {
  console.error('Demo seed failed:', error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
