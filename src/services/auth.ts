import { apiRequest } from '../constants/api';
import { authenticatedRequest } from './apiClient';
import { clearAccessToken, saveAccessToken } from './tokenStorage';

export type AppRole = 'passenger' | 'driver' | 'admin';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  isVerified?: boolean;
  createdAt?: string;
}

interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: Omit<ApiUser, 'role'> & { role: string; isVerified?: boolean };
}

function normalizeAuth(response: AuthResponse) {
  const role = response.user.role.toLowerCase() as AppRole;
  return { user: { ...response.user, role }, accessToken: response.accessToken };
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  await saveAccessToken(response.accessToken);
  return normalizeAuth(response);
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'passenger' | 'driver';
  vehicle?: { type: string; make: string; model: string; color: string; licensePlate: string };
}) {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...input, role: input.role.toUpperCase() }),
  });
  await saveAccessToken(response.accessToken);
  return normalizeAuth(response);
}

export async function fetchCurrentUser() {
  const response = await authenticatedRequest<{ user: Omit<ApiUser, 'role'> & { role: string } }>('/api/auth/me');
  return { ...response.user, role: response.user.role.toLowerCase() as AppRole };
}

export async function logout() {
  try {
    await authenticatedRequest<void>('/api/auth/logout', { method: 'POST' });
  } finally {
    await clearAccessToken();
  }
}

export async function forgetSession() {
  await clearAccessToken();
}
