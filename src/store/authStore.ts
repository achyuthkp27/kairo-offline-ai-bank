/**
 * Kairo — Authentication Store
 * Manages login state with hardcoded credentials
 */

import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;

  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// Hardcoded credentials — NO real backend auth
const VALID_USER_ID = 'Admin_Bank';
const VALID_PASSWORD = 'Premium_Secure';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  error: null,
  loginAttempts: 0,

  login: async (userId: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    // Simulate network delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (userId === VALID_USER_ID && password === VALID_PASSWORD) {
      set({
        isAuthenticated: true,
        userId,
        isLoading: false,
        error: null,
        loginAttempts: 0,
      });
      return true;
    }

    const attempts = get().loginAttempts + 1;
    set({
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid credentials. Please check your User ID and Password.',
      loginAttempts: attempts,
    });
    return false;
  },

  logout: () => {
    set({
      isAuthenticated: false,
      userId: null,
      isLoading: false,
      error: null,
      loginAttempts: 0,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
