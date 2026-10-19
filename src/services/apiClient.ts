import { apiRequest } from '../constants/api';
import { getAccessToken } from './tokenStorage';

type AuthRequestOptions = Parameters<typeof apiRequest>[1];

export async function authenticatedRequest<T>(path: string, options: AuthRequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  return apiRequest<T>(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}
