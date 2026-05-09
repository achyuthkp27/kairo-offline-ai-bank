import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

interface UIState {
  appContext: string;
  isAISheetVisible: boolean;
  isNotificationSheetVisible: boolean;
  initialAIQuery: string;
  isOnline: boolean;
  themeMode: ThemeMode;
  setAppContext: (context: string) => void;
  setAISheetVisible: (visible: boolean) => void;
  setNotificationSheetVisible: (visible: boolean) => void;
  setInitialAIQuery: (query: string) => void;
  setOnline: (online: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  appContext: 'Dashboard Home',
  isAISheetVisible: false,
  isNotificationSheetVisible: false,
  initialAIQuery: '',
  isOnline: true,
  themeMode: 'dark',
  setAppContext: (appContext) => set({ appContext }),
  setAISheetVisible: (isAISheetVisible) => set({ isAISheetVisible }),
  setNotificationSheetVisible: (isNotificationSheetVisible) => set({ isNotificationSheetVisible }),
  setInitialAIQuery: (initialAIQuery) => set({ initialAIQuery }),
  setOnline: (isOnline) => set({ isOnline }),
  setThemeMode: (themeMode) => set({ themeMode }),
  toggleTheme: () => set({ themeMode: get().themeMode === 'dark' ? 'light' : 'dark' }),
}));
