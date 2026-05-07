import { create } from 'zustand';

export interface KairoNotification {
  id: string;
  title: string;
  message: string;
  date: number;
  isRead: boolean;
  type: 'insight' | 'security' | 'transaction' | 'system';
}

interface NotificationState {
  notifications: KairoNotification[];
  addNotification: (notification: Omit<KairoNotification, 'id' | 'date' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'welcome-notif',
      title: 'Welcome to Kairo',
      message: 'Your Personal Financial Operating System is ready to secure your assets.',
      date: Date.now() - 3600000,
      isRead: false,
      type: 'system',
    },
    {
      id: 'security-notif',
      title: 'Biometric Security Active',
      message: 'Face ID / Touch ID protection is enabled for all transactions.',
      date: Date.now() - 7200000,
      isRead: true,
      type: 'security',
    },
  ],
  addNotification: (notif) => set((state) => ({
    notifications: [
      {
        ...notif,
        id: `notif-${Date.now()}`,
        date: Date.now(),
        isRead: false,
      },
      ...state.notifications,
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
