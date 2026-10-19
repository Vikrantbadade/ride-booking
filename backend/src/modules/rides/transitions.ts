import { RideStatus } from '@prisma/client';
import { HttpError } from '../../utils/errors';

const allowed: Partial<Record<RideStatus, RideStatus[]>> = {
  [RideStatus.ACCEPTED]: [RideStatus.ARRIVING],
  [RideStatus.ARRIVING]: [RideStatus.IN_PROGRESS],
  [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
};

export function assertRideTransition(from: RideStatus, to: RideStatus): void {
  if (!allowed[from]?.includes(to)) {
    throw new HttpError(409, `Ride cannot transition from ${from} to ${to}`, 'INVALID_RIDE_TRANSITION');
  }
}
