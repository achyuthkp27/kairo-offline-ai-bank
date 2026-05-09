import {
  Send,
  QrCode,
  Receipt,
  Plus,
  CreditCard,
  PieChart,
  TrendingUp,
  Zap,
} from 'lucide-react-native';

type DashboardColors = {
  accentBlue: string;
  accentCyan: string;
  success: string;
  error: string;
  gold: string;
};

export const getDashboardGradientColors = (isDark: boolean): [string, string, string] =>
  isDark ? ['#0A0A0A', '#111111', '#0A0A0A'] : ['#F5F5F7', '#EBEBED', '#E0E0E5'];

export const getQuickActions = (colors: DashboardColors) => [
  { id: 'send', name: 'Send Money', icon: Send, color: colors.accentBlue },
  { id: 'upi', name: 'UPI Transfer', icon: Zap, color: colors.accentCyan },
  { id: 'scan', name: 'Scan QR', icon: QrCode, color: colors.success },
  { id: 'pay', name: 'Pay Bills', icon: Receipt, color: colors.error },
  { id: 'add', name: 'Add Money', icon: Plus, color: colors.gold },
  { id: 'fd', name: 'Book FD', icon: CreditCard, color: '#8B5CF6' },
  { id: 'invest', name: 'Investments', icon: TrendingUp, color: colors.accentCyan },
  { id: 'analytics', name: 'Analytics', icon: PieChart, color: colors.accentBlue },
] as const;
