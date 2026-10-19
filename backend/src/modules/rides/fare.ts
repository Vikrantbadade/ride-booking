import type { RideInput } from './schemas';

export const PRICING = {
  economy: { base: 12, perKm: 8 },
  comfort: { base: 20, perKm: 14 },
  premium: { base: 35, perKm: 22 },
  xl: { base: 25, perKm: 16 },
} as const;

export type RideType = keyof typeof PRICING;
export type DistanceEstimate = {
  distanceKm: number;
  durationMinutes: number;
  source: 'straight_line_adjusted_estimate';
};

export function estimateDistance(
  pickup: RideInput['pickup'],
  destination: RideInput['destination'],
  roadFactor = Number(process.env.ROAD_DISTANCE_FACTOR || 1.25),
): DistanceEstimate {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - pickup.latitude);
  const longitudeDelta = radians(destination.longitude - pickup.longitude);
  const latitude1 = radians(pickup.latitude);
  const latitude2 = radians(destination.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const directKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const distanceKm = Number((directKm * roadFactor).toFixed(1));
  return {
    distanceKm,
    durationMinutes: Math.max(1, Math.ceil(distanceKm / 25 * 60)),
    source: 'straight_line_adjusted_estimate',
  };
}

export function estimateFare(distanceKm: number, rideType: RideType): number {
  const price = PRICING[rideType];
  return Number((price.base + distanceKm * price.perKm).toFixed(2));
}
