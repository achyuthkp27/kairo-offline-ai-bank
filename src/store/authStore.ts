import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { logger, validateCredentialPassword, validateCredentialUserId } from '../utils';

const KEYS = {
  userId: 'kairo_user_id',
  passwordHash: 'kairo_password_hash',
  isFirstLaunch: 'kairo_first_launch',
  rememberedUserId: 'kairo_remembered_user',
  rateLimit: 'kairo_rate_limit',
} as const;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;
const ITERATIONS = 12000;
const DEV_RESET_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_RESET_AUTH === 'true';

async function simpleHash(password: string, salt: string): Promise<string> {
  let digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
  for (let i = 0; i < ITERATIONS; i++) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${digest}:${password}:${salt}:${i}`
    );
  }
  return digest;
}

async function generateSalt(): Promise<string> {
  const randomBytes = Crypto.getRandomBytes(16);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = await simpleHash(password, salt);
  return `${salt}:${hash}:${ITERATIONS}`;
}

async function verifyPassword(input: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const salt = parts[0];
  const storedHash = parts[1];
  const hash = await simpleHash(input, salt);
  return hash === storedHash;
}

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  isFirstLaunch: boolean;
  isCheckingFirstLaunch: boolean;
  isLockedOut: boolean;
  lockoutEndTime: number | null;
  login: (userId: string, password: string) => Promise<boolean>;
  biometricLogin: () => Promise<boolean>;
  register: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkFirstLaunch: () => Promise<void>;
  getUserId: () => Promise<string | null>;
  setRememberedDevice: () => Promise<void>;
  isDeviceRemembered: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  isFirstLaunch: true,
  isCheckingFirstLaunch: true,
  isLockedOut: false,
  lockoutEndTime: null,

  checkFirstLaunch: async () => {
    try {
      if (DEV_RESET_AUTH) {
        await SecureStore.deleteItemAsync(KEYS.passwordHash);
        await SecureStore.deleteItemAsync(KEYS.userId);
        await SecureStore.deleteItemAsync(KEYS.rateLimit);
        logger.info('Auth dev reset: credentials cleared');
      }
      const stored = await SecureStore.getItemAsync(KEYS.passwordHash);
      const lockoutEnd = await SecureStore.getItemAsync(KEYS.rateLimit);
      const lockoutEndTime = lockoutEnd ? parseInt(lockoutEnd, 10) : null;
      const isLockedOut = lockoutEndTime !== null && lockoutEndTime > Date.now();
      set({ 
        isFirstLaunch: !stored, 
        isCheckingFirstLaunch: false,
        isLockedOut,
        lockoutEndTime: isLockedOut ? lockoutEndTime : null
      });
    } catch (e) {
      logger.error('Auth checkFirstLaunch failed', e);
      set({ isFirstLaunch: true, isCheckingFirstLaunch: false });
    }
  },

  getUserId: async () => {
    try {
      return await SecureStore.getItemAsync(KEYS.userId);
    } catch (e) {
      logger.error('Auth getUserId failed', e);
      return null;
    }
  },

  register: async (userId: string, password: string): Promise<boolean> => {
    const userIdError = validateCredentialUserId(userId);
    if (userIdError) {
      set({ isLoading: false, error: userIdError });
      return false;
    }
    const passwordError = validateCredentialPassword(password);
    if (passwordError) {
      set({ isLoading: false, error: passwordError });
      return false;
    }

    set({ isLoading: true, error: null });
    await new Promise(r => setTimeout(r, 600));

    try {
      const existing = await SecureStore.getItemAsync(KEYS.passwordHash);
      if (existing) {
        set({ isLoading: false, error: 'An account already exists on this device.' });
        return false;
      }

      const salt = await generateSalt();
      const hash = await hashPassword(password, salt);

      await SecureStore.setItemAsync(KEYS.userId, userId);
      await SecureStore.setItemAsync(KEYS.passwordHash, hash);

      set({
        isAuthenticated: true,
        userId,
        isLoading: false,
        isFirstLaunch: false,
        error: null,
        loginAttempts: 0,
      });
      return true;
    } catch (e) {
      logger.error('Auth register failed', e);
      set({ isLoading: false, error: 'Failed to save credentials. Please try again.' });
      return false;
    }
  },

  login: async (userId: string, password: string): Promise<boolean> => {
    const { isLockedOut, lockoutEndTime } = get();
    
    if (isLockedOut && lockoutEndTime && lockoutEndTime > Date.now()) {
      const remainingSeconds = Math.ceil((lockoutEndTime - Date.now()) / 1000);
      set({ error: `Too many failed attempts. Please wait ${remainingSeconds} seconds.` });
      return false;
    }

    if (!userId || !password) {
      set({ error: 'Please enter both User ID and Password.' });
      return false;
    }

    set({ isLoading: true, error: null });
    await new Promise(r => setTimeout(r, 600));

    try {
      const storedUserId = await SecureStore.getItemAsync(KEYS.userId);
      const storedHash = await SecureStore.getItemAsync(KEYS.passwordHash);

      if (!storedHash || !storedUserId) {
        set({ isLoading: false, error: 'No account found. Please register first.' });
        return false;
      }

      const isValid = await verifyPassword(password, storedHash);
      
      if (userId.toLowerCase() !== storedUserId.toLowerCase() || !isValid) {
        const attempts = get().loginAttempts + 1;
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutEnd = Date.now() + LOCKOUT_DURATION_MS;
          await SecureStore.setItemAsync(KEYS.rateLimit, lockoutEnd.toString());
          set({
            isAuthenticated: false,
            isLoading: false,
            error: 'Too many failed attempts. Please wait 30 seconds.',
            loginAttempts: attempts,
            isLockedOut: true,
            lockoutEndTime: lockoutEnd,
          });
        } else {
          set({
            isAuthenticated: false,
            isLoading: false,
            error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - attempts} attempts remaining.`,
            loginAttempts: attempts,
          });
        }
        return false;
      }

      const lockoutKey = await SecureStore.getItemAsync(KEYS.rateLimit);
      if (lockoutKey) {
        await SecureStore.deleteItemAsync(KEYS.rateLimit);
      }

      set({
        isAuthenticated: true,
        userId,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLockedOut: false,
        lockoutEndTime: null,
      });
      return true;
    } catch (e) {
      logger.error('Auth login failed', e);
      set({ isLoading: false, error: 'Authentication failed. Please try again.' });
      return false;
    }
  },

  biometricLogin: async (): Promise<boolean> => {
    const { isLockedOut, lockoutEndTime } = get();
    
    if (isLockedOut && lockoutEndTime && lockoutEndTime > Date.now()) {
      const remainingSeconds = Math.ceil((lockoutEndTime - Date.now()) / 1000);
      set({ error: `Too many failed attempts. Please wait ${remainingSeconds} seconds.` });
      return false;
    }

    set({ isLoading: true, error: null });
    await new Promise(r => setTimeout(r, 400));

    try {
      const storedUserId = await SecureStore.getItemAsync(KEYS.userId);
      const storedHash = await SecureStore.getItemAsync(KEYS.passwordHash);

      if (!storedHash || !storedUserId) {
        set({ isLoading: false, error: 'No account found on this device.' });
        return false;
      }

      set({
        isAuthenticated: true,
        userId: storedUserId,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLockedOut: false,
        lockoutEndTime: null,
      });
      return true;
    } catch (e) {
      logger.error('Auth biometricLogin failed', e);
      set({ isLoading: false, error: 'Biometric authentication failed.' });
      return false;
    }
  },

  setRememberedDevice: async () => {
    const userId = get().userId;
    if (userId) {
      try {
        await SecureStore.setItemAsync(KEYS.rememberedUserId, userId);
      } catch (e) {
        logger.error('Auth setRememberedDevice failed', e);
      }
    }
  },

  isDeviceRemembered: async () => {
    try {
      return !!(await SecureStore.getItemAsync(KEYS.rememberedUserId));
    } catch (e) {
      logger.error('Auth isDeviceRemembered failed', e);
      return false;
    }
  },

  logout: async () => {
    set({
      isAuthenticated: false,
      userId: null,
      isLoading: false,
      error: null,
      loginAttempts: 0,
      isLockedOut: false,
      lockoutEndTime: null,
    });
    try {
      await SecureStore.deleteItemAsync(KEYS.rememberedUserId);
    } catch (e) {
      logger.error('Auth logout cleanup failed', e);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
