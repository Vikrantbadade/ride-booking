import { create } from 'zustand';
import type { AdminDriver, VerificationStatus } from '../services/admin';
import { getAdminDrivers, setDriverVerification } from '../services/admin';

interface AdminDriverView {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  vehicleColor: string;
  licensePlate: string;
  isOnline: boolean;
  isVerified: boolean;
  totalRides: number;
  documents: Record<string, VerificationStatus>;
}

interface DriverVerification {
  id: string;
  driverId: string;
  driverName: string;
  submittedAt: string;
  documents: Partial<Record<'license' | 'insurance' | 'vehicleRC', VerificationStatus>>;
  overallStatus: VerificationStatus;
  adminNotes?: string;
}

interface AdminState {
  drivers: AdminDriverView[];
  pendingVerifications: DriverVerification[];
  isLoadingDrivers: boolean;
  driversError: string | null;
  systemStats: {
    totalRides: number;
    activeDrivers: number;
    totalPassengers: number;
    totalRevenue: number;
    todayRides: number;
  };
  fetchDrivers: () => Promise<void>;
  approveDriver: (driverId: string, notes?: string) => Promise<void>;
  rejectDriver: (driverId: string, reason: string) => Promise<void>;
}

const mapDriver = (driver: AdminDriver): AdminDriverView => ({
  id: driver.id,
  name: driver.user.name,
  email: driver.user.email,
  phone: driver.user.phone || '—',
  vehicle: driver.vehicle ? [driver.vehicle.make, driver.vehicle.model].filter(Boolean).join(' ') || driver.vehicle.type : 'Vehicle not registered',
  vehicleColor: driver.vehicle?.color || '—',
  licensePlate: driver.vehicle?.licensePlate || '—',
  isOnline: driver.online,
  isVerified: driver.verification === 'APPROVED',
  totalRides: driver._count.rides,
  documents: {},
});

const mapVerification = (driver: AdminDriver): DriverVerification => ({
  id: driver.id,
  driverId: driver.id,
  driverName: driver.user.name,
  submittedAt: driver.createdAt,
  documents: {},
  overallStatus: driver.verification.toLowerCase() as VerificationStatus,
});

export const useAdminStore = create<AdminState>((set, get) => ({
  drivers: [],
  pendingVerifications: [],
  isLoadingDrivers: false,
  driversError: null,
  systemStats: {
    totalRides: 15432,
    activeDrivers: 0,
    totalPassengers: 8741,
    totalRevenue: 2847500,
    todayRides: 347,
  },

  fetchDrivers: async () => {
    set({ isLoadingDrivers: true, driversError: null });
    try {
      const apiDrivers = await getAdminDrivers();
      const drivers = apiDrivers.map(mapDriver);
      set({
        drivers,
        pendingVerifications: apiDrivers.map(mapVerification),
        systemStats: { ...get().systemStats, activeDrivers: drivers.filter((driver) => driver.isOnline).length },
        isLoadingDrivers: false,
      });
    } catch (error) {
      set({ isLoadingDrivers: false, driversError: error instanceof Error ? error.message : 'Could not load driver records.' });
      throw error;
    }
  },

  approveDriver: async (driverId, notes = 'Approved by administrator') => {
    await setDriverVerification(driverId, 'APPROVED', notes);
    await get().fetchDrivers();
  },

  rejectDriver: async (driverId, reason) => {
    await setDriverVerification(driverId, 'REJECTED', reason);
    await get().fetchDrivers();
  },
}));
