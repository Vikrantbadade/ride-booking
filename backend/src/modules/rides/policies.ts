import { RideStatus } from '@prisma/client';
import { HttpError } from '../../utils/errors';

const cancellableStatuses: RideStatus[] = [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.ARRIVING];

export function assertRideCancellable(status: RideStatus): void {
  if (!cancellableStatuses.includes(status)) {
    throw new HttpError(409, 'This ride can no longer be cancelled', 'RIDE_NOT_CANCELLABLE');
  }
}

export function assertRidePayable(status: RideStatus, hasInvoice: boolean, environment: string): void {
  if (environment !== 'development') throw new HttpError(501, 'A production payment provider is not configured', 'PAYMENT_PROVIDER_UNAVAILABLE');
  if (status !== RideStatus.COMPLETED || !hasInvoice) throw new HttpError(409, 'Only completed rides with an invoice can be paid', 'RIDE_NOT_PAYABLE');
}
