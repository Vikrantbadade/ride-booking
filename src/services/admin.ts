import { authenticatedRequest } from './apiClient';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminDriver {
  id: string;
  user: { id: string; name: string; email: string; phone: string | null; createdAt: string };
  verification: string;
  online: boolean;
  createdAt: string;
  vehicle: null | { type: string; make: string | null; model: string | null; color: string | null; licensePlate: string };
  _count: { rides: number };
}

export async function getAdminDrivers() {
  const response = await authenticatedRequest<{ drivers: AdminDriver[] }>('/api/admin/drivers');
  return response.drivers;
}

export async function setDriverVerification(driverId: string, status: 'APPROVED' | 'REJECTED', notes: string) {
  return authenticatedRequest<{ driver: { id: string; verification: string } }>(`/api/admin/drivers/${encodeURIComponent(driverId)}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}
