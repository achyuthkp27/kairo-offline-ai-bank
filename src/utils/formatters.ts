/**
 * Kairo — Formatting Utilities
 * Currency, date, and number formatting for Indian locale
 */

/**
 * Format amount in Indian currency format (₹12,45,280.00)
 */
export const formatCurrency = (
  amount: number,
  currency: string = '₹',
  showDecimal: boolean = true
): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  });
  return `${currency}${formatter.format(amount)}`;
};

/**
 * Format masked currency (₹••••••)
 */
export const formatMaskedCurrency = (currency: string = '₹'): string => {
  return `${currency}••••••`;
};

/**
 * Format card number with masking
 */
export const formatCardNumber = (number: string): string => {
  return number.replace(/(\d{4})\s?/g, '$1 ').trim();
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Format date for display
 */
export const formatDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format short date
 */
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Format time
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format large numbers with abbreviation
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
