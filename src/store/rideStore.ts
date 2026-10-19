import { create } from 'zustand';
import { RIDE_TYPES } from '../constants/mockData';
import * as ridesApi from '../services/rides';

type RideStatus = 'idle' | 'searching' | 'driver_assigned' | 'driver_arriving' | 'in_progress' | 'completed' | 'cancelled';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Driver {
  id: string;
  name: string;
  rating?: number;
  vehicle: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
  phone: string | null;
  location: Location | null;
  eta?: number; // minutes
}

interface Ride {
  id: string;
  status: RideStatus;
  pickup?: Location;
  destination?: Location;
  passenger?: { id: string; name: string; phone: string | null };
  driver?: Driver;
  rideType?: string;
  estimatedFare?: number;
  finalFare?: number;
  estimatedDuration?: number; // minutes
  estimatedDistance?: number; // km
  startedAt?: string;
  completedAt?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  invoiceNo?: string;
  invoiceIssuedAt?: string;
}

interface RideHistoryRecord {
  id: string;
  passengerId: string;
  driverId: string;
  pickup: Location;
  destination: Location;
  fare: number;
  distance: number;
  duration: number;
  status: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
}

type ApiStatus = ridesApi.ApiRide['status'];
let bookingInFlight = false;
let rideRefreshInFlight: Promise<void> | null = null;
let assignedRideRefreshInFlight: Promise<void> | null = null;

const STATUS_MAP: Record<ApiStatus, RideStatus> = {
  REQUESTED: 'searching',
  ACCEPTED: 'driver_assigned',
  ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

function fromApiRide(ride: ridesApi.ApiRide): Ride {
  const location = ride.driver?.location
    ? { latitude: ride.driver.location.latitude, longitude: ride.driver.location.longitude }
    : null;
  return {
    id: ride.id,
    status: STATUS_MAP[ride.status],
    pickup: ride.pickup,
    destination: ride.destination,
    passenger: ride.passenger,
    rideType: ride.rideType,
    estimatedFare: ride.estimatedFare,
    finalFare: ride.finalFare ?? undefined,
    estimatedDistance: ride.estimatedDistance,
    estimatedDuration: ride.estimatedDuration,
    startedAt: ride.startedAt ?? undefined,
    completedAt: ride.completedAt ?? undefined,
    paymentStatus: ride.payment?.status.toLowerCase() ?? (ride.status === 'COMPLETED' ? 'pending' : undefined),
    paymentMethod: ride.payment?.method ?? undefined,
    invoiceNo: ride.invoice?.invoiceNo,
    invoiceIssuedAt: ride.invoice?.issuedAt,
    driver: ride.driver ? {
      id: ride.driver.id,
      name: ride.driver.name,
      vehicle: ride.driver.vehicle,
      vehicleColor: ride.driver.vehicleColor,
      licensePlate: ride.driver.licensePlate,
      phone: ride.driver.phone,
      location,
    } : undefined,
  };
}

function toHistoryRecord(ride: ridesApi.ApiRide): RideHistoryRecord {
  return {
    id: ride.id,
    passengerId: '',
    driverId: ride.driver?.id || '',
    pickup: ride.pickup,
    destination: ride.destination,
    fare: ride.finalFare ?? ride.estimatedFare,
    distance: ride.estimatedDistance,
    duration: ride.estimatedDuration,
    status: STATUS_MAP[ride.status],
    date: ride.completedAt || ride.createdAt,
    paymentMethod: ride.payment?.method || '',
    paymentStatus: ride.payment?.status.toLowerCase() || 'pending',
  };
}

export const getRouteDistance = (pickup: Location, destination: Location) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - pickup.latitude);
  const longitudeDelta = toRadians(destination.longitude - pickup.longitude);
  const latitude1 = toRadians(pickup.latitude);
  const latitude2 = toRadians(destination.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const straightLineDistance = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  // Apply a road-distance factor; this is an estimate until a routing service is connected.
  return Number((straightLineDistance * 1.25).toFixed(1));
};

interface RideState {
  currentRide: Ride | null;
  rideHistory: RideHistoryRecord[];
  historyLoading: boolean;
  historyError: string | null;
  selectedRideType: string;
  driverLocation: Location | null;
  setPickup: (location: Location) => void;
  setDestination: (location: Location) => void;
  setRideType: (typeId: string) => void;
  bookRide: () => Promise<void>;
  retryMatching: () => Promise<void>;
  refreshCurrentRide: () => Promise<void>;
  restoreCurrentRide: () => Promise<void>;
  refreshAssignedRide: () => Promise<void>;
  declineCurrentRide: () => Promise<void>;
  fetchRideHistory: () => Promise<void>;
  cancelRide: () => Promise<void>;
  payForRide: (method: string) => Promise<void>;
  transitionRideStatus: (status: 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
  resetRide: () => void;
  updateDriverLocation: (location: Location) => Promise<void>;
  getFareEstimate: (distance: number, rideTypeId?: string) => number;
}

export const useRideStore = create<RideState>((set, get) => ({
  currentRide: null,
  rideHistory: [],
  historyLoading: false,
  historyError: null,
  selectedRideType: 'economy',
  driverLocation: null,

  setPickup: (location) =>
    set((s) => ({
      currentRide: s.currentRide
        ? { ...s.currentRide, pickup: location }
        : { id: '', status: 'idle', pickup: location },
    })),

  setDestination: (location) =>
    set((s) => ({
      currentRide: s.currentRide
        ? { ...s.currentRide, destination: location }
        : { id: '', status: 'idle', destination: location },
    })),

  setRideType: (typeId) => set({ selectedRideType: typeId }),

  getFareEstimate: (distance, rideTypeId) => {
    const typeId = rideTypeId || get().selectedRideType;
    const type = RIDE_TYPES.find((r) => r.id === typeId);
    if (!type) return 0;
    return Math.round(type.baseRate + type.perKm * distance);
  },

  bookRide: async () => {
    const { currentRide, selectedRideType } = get();
    if (bookingInFlight) return;
    if (!currentRide?.pickup || !currentRide?.destination) return;
    if (['searching', 'driver_assigned', 'driver_arriving', 'in_progress'].includes(currentRide.status)) return;
    bookingInFlight = true;
    try {
      const ride = await ridesApi.requestRide({
        pickup: { ...currentRide.pickup, address: currentRide.pickup.address || '' },
        destination: { ...currentRide.destination, address: currentRide.destination.address || '' },
        rideType: selectedRideType,
      });
      const mappedRide = fromApiRide(ride);
      set({ currentRide: mappedRide, driverLocation: mappedRide.driver?.location || null });
    } finally {
      bookingInFlight = false;
    }
  },

  retryMatching: async () => {
    const ride = get().currentRide;
    if (!ride?.id || ride.status !== 'searching') return;
    const updatedRide = fromApiRide(await ridesApi.retryMatching(ride.id));
    set({ currentRide: updatedRide, driverLocation: updatedRide.driver?.location || null });
  },

  refreshCurrentRide: async () => {
    if (rideRefreshInFlight) return rideRefreshInFlight;
    const ride = get().currentRide;
    if (!ride?.id) return;
    rideRefreshInFlight = (async () => {
      const updatedRide = fromApiRide(await ridesApi.getRide(ride.id));
      set((state) => state.currentRide?.id === ride.id
        ? { currentRide: updatedRide, driverLocation: updatedRide.driver?.location || null }
        : {});
    })();
    try {
      await rideRefreshInFlight;
    } finally {
      rideRefreshInFlight = null;
    }
  },

  restoreCurrentRide: async () => {
    try {
      const rides = await ridesApi.getRides(50);
      set({ rideHistory: rides.map(toHistoryRecord) });
      const resumable = rides.find((ride) =>
        ['REQUESTED', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS'].includes(ride.status)
        || (ride.status === 'COMPLETED' && ride.payment?.status !== 'PAID')
      );
      const mappedRide = resumable ? fromApiRide(resumable) : null;
      set({ currentRide: mappedRide, driverLocation: mappedRide?.driver?.location || null });
    } catch {
      // Auth restoration must remain available when ride-history requests temporarily fail.
    }
  },

  refreshAssignedRide: async () => {
    if (assignedRideRefreshInFlight) return assignedRideRefreshInFlight;
    assignedRideRefreshInFlight = (async () => {
      const rides = await ridesApi.getRides(50);
      const activeRide = rides.find((ride) => ['ACCEPTED', 'ARRIVING', 'IN_PROGRESS'].includes(ride.status));
      if (activeRide) {
        const mappedRide = fromApiRide(activeRide);
        set({ currentRide: mappedRide, driverLocation: mappedRide.driver?.location || null });
      }
    })();
    try {
      await assignedRideRefreshInFlight;
    } finally {
      assignedRideRefreshInFlight = null;
    }
  },

  declineCurrentRide: async () => {
    const ride = get().currentRide;
    if (!ride?.id || ride.status !== 'driver_assigned') return;
    await ridesApi.declineAssignedRide(ride.id);
    set({ currentRide: null, driverLocation: null });
  },

  fetchRideHistory: async () => {
    set({ historyLoading: true, historyError: null });
    try {
      const rides = await ridesApi.getRides();
      set({ rideHistory: rides.map(toHistoryRecord), historyLoading: false });
    } catch (error) {
      set({ historyLoading: false, historyError: error instanceof Error ? error.message : 'Could not load ride history.' });
      throw error;
    }
  },

  cancelRide: async () => {
    const ride = get().currentRide;
    if (!ride?.id) return;
    const cancelled = fromApiRide(await ridesApi.cancelRide(ride.id));
    set({ currentRide: cancelled, driverLocation: null });
  },

  payForRide: async (method) => {
    const ride = get().currentRide;
    if (!ride?.id) return;
    await ridesApi.payForRide(ride.id, method);
    const updatedRide = fromApiRide(await ridesApi.getRide(ride.id));
    set((state) => ({
      currentRide: updatedRide,
      rideHistory: state.rideHistory.map((record) => record.id === updatedRide.id
        ? { ...record, fare: updatedRide.finalFare ?? record.fare, paymentStatus: 'paid', paymentMethod: method }
        : record),
    }));
  },

  transitionRideStatus: async (status) => {
    const ride = get().currentRide;
    if (!ride?.id) return;
    const responseRide = await ridesApi.updateRideStatus(ride.id, status);
    const updatedRide = fromApiRide(responseRide);
    const completedRide = status === 'COMPLETED' ? await ridesApi.getRide(ride.id) : null;
    set((state) => ({
      currentRide: updatedRide,
      driverLocation: updatedRide.driver?.location || state.driverLocation,
      rideHistory: status === 'COMPLETED'
        ? [toHistoryRecord(completedRide!), ...state.rideHistory.filter((item) => item.id !== ride.id)]
        : state.rideHistory,
    }));
  },

  resetRide: () => {
    set({ currentRide: null, driverLocation: null });
  },

  updateDriverLocation: async (location) => {
    const ride = get().currentRide;
    if (ride?.id) await ridesApi.updateDriverLocation(location.latitude, location.longitude, ride.id);
    else await ridesApi.updateDriverLocation(location.latitude, location.longitude);
    set((state) => ({
      driverLocation: location,
      currentRide: state.currentRide?.driver
        ? { ...state.currentRide, driver: { ...state.currentRide.driver, location } }
        : state.currentRide,
    }));
  },
}));
