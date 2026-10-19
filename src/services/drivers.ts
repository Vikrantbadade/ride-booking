import { authenticatedRequest } from './apiClient';

export interface DriverProfile {
  id: string;
  verification: 'PENDING' | 'APPROVED' | 'REJECTED';
  online: boolean;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: string | null;
  _count: { rides: number };
  vehicle: null | {
    type: string;
    make: string | null;
    model: string | null;
    color: string | null;
    licensePlate: string;
  };
}

export async function getDriverProfile() {
  const response = await authenticatedRequest<{ profile: DriverProfile }>('/api/drivers/me');
  return response.profile;
}

export async function setDriverAvailability(online: boolean) {
  return authenticatedRequest<{ online: boolean; verification: DriverProfile['verification'] }>('/api/drivers/me/availability', {
    method: 'PUT', body: JSON.stringify({ online }),
  });
}
