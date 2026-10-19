import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { PrismaClient, User, UserRole } from '@prisma/client';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { RegisterInput } from './schemas';
import { HttpError } from '../../utils/errors';

const PASSWORD_COST = 12;
const ACCESS_TOKEN_TTL = (process.env.JWT_ACCESS_TTL || '1h') as NonNullable<SignOptions['expiresIn']>;

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'createdAt'>;
export type TokenClaims = { sub: string; role: UserRole; sid: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(claims: TokenClaims, secret: string): string {
  return jwt.sign(claims, secret, { expiresIn: ACCESS_TOKEN_TTL, issuer: 'ridex-api', audience: 'ridex-client' });
}

export function verifyAccessToken(token: string, secret: string): TokenClaims {
  const decoded = jwt.verify(token, secret, { issuer: 'ridex-api', audience: 'ridex-client' });
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.sid !== 'string' || typeof decoded.role !== 'string') {
    throw new HttpError(401, 'Invalid access token', 'INVALID_TOKEN');
  }
  return { sub: decoded.sub, sid: decoded.sid, role: decoded.role as UserRole };
}

function publicUser(user: User): PublicUser {
  const { id, name, email, phone, role, createdAt } = user;
  return { id, name, email, phone, role, createdAt };
}

export async function createSession(prisma: PrismaClient, userId: string, role: UserRole, secret: string) {
  const sessionId = randomUUID();
  const token = signAccessToken({ sub: userId, role, sid: sessionId }, secret);
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded && typeof decoded === 'object' && decoded.exp ? decoded.exp * 1000 : Date.now() + 60 * 60 * 1000);
  await prisma.authSession.create({ data: { id: sessionId, userId, expiresAt } });
  return { accessToken: token, tokenType: 'Bearer' as const, expiresAt };
}

export async function register(prisma: PrismaClient, input: RegisterInput, secret: string) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        passwordHash,
        role: input.role,
        ...(input.role === 'PASSENGER'
          ? { passengerProfile: { create: {} } }
          : { driverProfile: { create: { vehicle: { create: input.vehicle! } } } }),
      },
      include: { driverProfile: { select: { verification: true } } },
    });
    return created;
  });
  const session = await createSession(prisma, user.id, user.role, secret);
  return { user: { ...publicUser(user), isVerified: user.driverProfile?.verification === 'APPROVED' }, ...session };
}

export async function login(prisma: PrismaClient, email: string, password: string, secret: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { driverProfile: { select: { verification: true } } } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  const session = await createSession(prisma, user.id, user.role, secret);
  return { user: { ...publicUser(user), isVerified: user.driverProfile?.verification === 'APPROVED' }, ...session };
}

export async function revokeSession(prisma: PrismaClient, sessionId: string, userId: string) {
  await prisma.authSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
