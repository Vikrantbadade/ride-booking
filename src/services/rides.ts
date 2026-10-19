import { apiRequest } from '../constants/api';
import { authenticatedRequest } from './apiClient';

export interface RideLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface RideEstimate {
  distanceKm: number;
  durationMinutes: number;
  source: 'straight_line_adjusted_estimate';
  rideType: string;
  estimatedFare: number;
  currency: string;
}

export interface ApiRide {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  rideType: string;
  pickup: RideLocation;
  destination: RideLocation;
  passenger: { id: string; name: string; phone: string | null };
  estimatedFare: number;
  finalFare: number | null;
  estimatedDistance: number;
  estimatedDuration: number;
  distanceSource: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  driver: null | {
    id: string;
    name: string;
    phone: string | null;
    verified: boolean;
    location: null | { latitude: number; longitude: number; updatedAt: string | null };
    vehicle: string | null;
    vehicleColor: string | null;
    licensePlate: string | null;
  };
  payment: null | { status: string; method: string | null; amount: number; currency: string };
  invoice: null | { invoiceNo: string; issuedAt: string; subtotal: number; total: number; currency: string; snapshot: unknown };
}

export async function estimateRide(input: { pickup: RideLocation; destination: RideLocation; rideType: string }) {
  const response = await apiRequest<{ estimate: RideEstimate }>('/api/rides/estimate', { method: 'POST', body: JSON.stringify(input) });
  return response.estimate;
}

export async function requestRide(input: { pickup: RideLocation; destination: RideLocation; rideType: string }) {
  const response = await authenticatedRequest<{ ride: ApiRide }>('/api/rides', { method: 'POST', body: JSON.stringify(input) });
  return response.ride;
}

export async function retryMatching(rideId: string) {
  const response = await authenticatedRequest<{ ride: ApiRide }>(`/api/rides/${encodeURIComponent(rideId)}/match`, { method: 'POST' });
  return response.ride;
}

export async function declineAssignedRide(rideId: string) {
  const response = await authenticatedRequest<{ ride: ApiRide }>(`/api/rides/${encodeURIComponent(rideId)}/decline`, { method: 'POST' });
  return response.ride;
}

export async function getRide(rideId: string) {
  const response = await authenticatedRequest<{ ride: ApiRide }>(`/api/rides/${encodeURIComponent(rideId)}`);
  return response.ride;
}

export async function getRides(limit = 50) {
  const response = await authenticatedRequest<{ rides: ApiRide[] }>(`/api/rides?limit=${limit}`);
  return response.rides;
}

export async function cancelRide(rideId: string, reason?: string) {
  const response = await authenticatedRequest<{ ride: ApiRide }>(`/api/rides/${encodeURIComponent(rideId)}/cancel`, {
    method: 'POST', body: JSON.stringify(reason ? { reason } : {}),
  });
  return response.ride;
}

export async function payForRide(rideId: string, method: string) {
  const response = await authenticatedRequest<{ payment: { status: string; amount: number; method: string | null }; invoice: ApiRide['invoice'] }>(`/api/rides/${encodeURIComponent(rideId)}/payments/development`, {
    method: 'POST',
    body: JSON.stringify({ method, idempotencyKey: `dev-${rideId}` }),
  });
  return response;
}

export async function updateRideStatus(rideId: string, status: 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED') {
  const response = await authenticatedRequest<{ ride: ApiRide }>(`/api/rides/${encodeURIComponent(rideId)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
  return response.ride;
}

export async function updateDriverLocation(latitude: number, longitude: number, rideId?: string) {
  return authenticatedRequest<{ updatedAt: string }>('/api/drivers/me/location', {
    method: 'PUT', body: JSON.stringify({ latitude, longitude, ...(rideId ? { rideId } : {}) }),
  });
}
