import { create } from 'zustand';
import type { ApiUser, AppRole } from '../services/auth';
import * as authService from '../services/auth';
import { forgetSession } from '../services/auth';
import { useRideStore } from './rideStore';

export type UserRole = AppRole | null;
export type User = ApiUser;

interface AuthState {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<AppRole>;
  logout: () => Promise<void>;
  register: (data: {
    name: string; email: string; phone: string; password: string; role: 'passenger' | 'driver';
    vehicle?: { type: string; make: string; model: string; color: string; licensePlate: string };
  }) => Promise<AppRole>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrating: true,

  restoreSession: async () => {
    try {
      const user = await authService.fetchCurrentUser();
      set({ user, role: user.role, isAuthenticated: true });
      await useRideStore.getState().restoreCurrentRide();
      set({ isHydrating: false });
    } catch {
      try {
        await forgetSession();
      } catch {
        // An inaccessible local token is treated as a signed-out session.
      }
      set({ user: null, role: null, isAuthenticated: false, isHydrating: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.login(email.trim(), password);
      set({ user, role: user.role, isAuthenticated: true, isLoading: false });
      return user.role;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Local credentials are cleared by the auth service even when server revocation is unavailable.
    } finally {
      set({ user: null, role: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.register(data);
      set({ user, role: user.role, isAuthenticated: true, isLoading: false });
      return user.role;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
