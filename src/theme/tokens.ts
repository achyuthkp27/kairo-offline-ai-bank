/**
 * Kairo Design System — Theme Tokens
 * Ultra Premium Dark Mode Banking Aesthetic
 */

export const Colors = {
  // Core backgrounds
  background: '#0A0A0A',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1A1A1A',
  
  // Card surfaces with glassmorphism
  cardSurface: 'rgba(255, 255, 255, 0.06)',
  cardSurfaceHover: 'rgba(255, 255, 255, 0.10)',
  cardSurfaceActive: 'rgba(255, 255, 255, 0.14)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderHover: 'rgba(255, 255, 255, 0.15)',
  
  // Primary accent colors
  accentBlue: '#2E5BFF',
  accentBlueSoft: 'rgba(46, 91, 255, 0.15)',
  accentBlueGlow: 'rgba(46, 91, 255, 0.40)',
  
  accentCyan: '#00D4FF',
  accentCyanSoft: 'rgba(0, 212, 255, 0.15)',
  accentCyanGlow: 'rgba(0, 212, 255, 0.40)',
  
  // Status colors
  success: '#00FF99',
  successSoft: 'rgba(0, 255, 153, 0.15)',
  successGlow: 'rgba(0, 255, 153, 0.30)',
  
  error: '#FF4D6D',
  errorSoft: 'rgba(255, 77, 109, 0.15)',
  errorGlow: 'rgba(255, 77, 109, 0.30)',
  
  warning: '#FFB800',
  warningSoft: 'rgba(255, 184, 0, 0.15)',
  
  // Gold accent (premium)
  gold: '#D4AF37',
  goldSoft: 'rgba(212, 175, 55, 0.15)',
  goldGlow: 'rgba(212, 175, 55, 0.30)',
  
  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textTertiary: 'rgba(255, 255, 255, 0.45)',
  textMuted: 'rgba(255, 255, 255, 0.25)',
  textInverse: '#0A0A0A',
  
  // Dividers & borders
  divider: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.10)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.60)',
  overlayHeavy: 'rgba(0, 0, 0, 0.85)',
  
  // Shimmer
  shimmerBase: 'rgba(255, 255, 255, 0.04)',
  shimmerHighlight: 'rgba(255, 255, 255, 0.08)',
} as const;

export const LightColors = {
  background: '#F5F5F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F0F0F2',
  cardSurface: 'rgba(255, 255, 255, 0.9)',
  cardSurfaceHover: 'rgba(255, 255, 255, 0.95)',
  cardSurfaceActive: 'rgba(255, 255, 255, 1)',
  cardBorder: 'rgba(0, 0, 0, 0.08)',
  cardBorderHover: 'rgba(0, 0, 0, 0.15)',
  accentBlue: '#2E5BFF',
  accentBlueSoft: 'rgba(46, 91, 255, 0.12)',
  accentBlueGlow: 'rgba(46, 91, 255, 0.25)',
  accentCyan: '#00A3CC',
  accentCyanSoft: 'rgba(0, 163, 204, 0.12)',
  accentCyanGlow: 'rgba(0, 163, 204, 0.25)',
  success: '#00CC66',
  successSoft: 'rgba(0, 204, 102, 0.12)',
  successGlow: 'rgba(0, 204, 102, 0.25)',
  error: '#E53935',
  errorSoft: 'rgba(229, 57, 53, 0.12)',
  errorGlow: 'rgba(229, 57, 53, 0.25)',
  warning: '#F9A825',
  warningSoft: 'rgba(249, 168, 37, 0.12)',
  gold: '#C9A227',
  goldSoft: 'rgba(201, 162, 39, 0.12)',
  goldGlow: 'rgba(201, 162, 39, 0.25)',
  textPrimary: '#0A0A0A',
  textSecondary: 'rgba(10, 10, 10, 0.70)',
  textTertiary: 'rgba(10, 10, 10, 0.45)',
  textMuted: 'rgba(10, 10, 10, 0.25)',
  textInverse: '#FFFFFF',
  divider: 'rgba(0, 0, 0, 0.08)',
  border: 'rgba(0, 0, 0, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.40)',
  overlayHeavy: 'rgba(0, 0, 0, 0.70)',
  shimmerBase: 'rgba(0, 0, 0, 0.04)',
  shimmerHighlight: 'rgba(255, 255, 255, 0.8)',
} as const;

export const Gradients = {
  // Card gradients
  cardPrimary: ['#1A1F3D', '#0D1117'] as const,
  cardSavings: ['#0B3D2E', '#0A1A14'] as const,
  cardCredit: ['#3D1A2E', '#1A0D14'] as const,
  cardInvestment: ['#1A2E3D', '#0D1420'] as const,
  cardCrypto: ['#2E1A3D', '#140D1A'] as const,
  cardTravel: ['#3D2E1A', '#1A140D'] as const,
  
  // Premium card overlays
  premiumBlue: ['#2E5BFF', '#0047FF', '#0033CC'] as const,
  premiumCyan: ['#00D4FF', '#0099CC', '#006699'] as const,
  premiumGold: ['#D4AF37', '#B8941F', '#8B6F14'] as const,
  premiumDark: ['#1A1A2E', '#16213E', '#0F3460'] as const,
  premiumPurple: ['#6C5CE7', '#5641D4', '#3D2CB5'] as const,
  
  // Background effects
  meshGradient: ['#0A0A0A', '#0D1117', '#0A0A0A'] as const,
  glowBlue: ['rgba(46, 91, 255, 0.30)', 'rgba(46, 91, 255, 0)'] as const,
  glowCyan: ['rgba(0, 212, 255, 0.30)', 'rgba(0, 212, 255, 0)'] as const,
  glowGold: ['rgba(212, 175, 55, 0.20)', 'rgba(212, 175, 55, 0)'] as const,
  
  // Hero orbs
  orbBlue: ['rgba(46, 91, 255, 0.25)', 'rgba(46, 91, 255, 0.05)', 'transparent'] as const,
  orbCyan: ['rgba(0, 212, 255, 0.20)', 'rgba(0, 212, 255, 0.05)', 'transparent'] as const,
  orbPurple: ['rgba(108, 92, 231, 0.20)', 'rgba(108, 92, 231, 0.05)', 'transparent'] as const,
} as const;

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
    black: 'Inter_900Black',
  },
  
  // Type scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 42,
    '5xl': 56,
    hero: 72,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 2.0,
  },
} as const;

export const Spacing = {
  // 8pt grid system
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

export const Shadows = {
  // Soft glow shadows
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 18,
  },
  
  // Colored glows
  glowBlue: {
    shadowColor: '#2E5BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowCyan: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  glowGold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glowSuccess: {
    shadowColor: '#00FF99',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glowError: {
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const AnimationConfig = {
  // Spring presets
  spring: {
    gentle: { damping: 20, stiffness: 180, mass: 1 },
    snappy: { damping: 15, stiffness: 300, mass: 0.8 },
    bouncy: { damping: 10, stiffness: 200, mass: 0.6 },
    slow: { damping: 25, stiffness: 120, mass: 1.2 },
  },
  
  // Timing presets
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
    cinematic: 600,
    dramatic: 800,
  },
} as const;

export const LightGlassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    blurIntensity: 20,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    blurIntensity: 40,
  },
  heavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    blurIntensity: 60,
  },
} as const;

export const Glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    blurIntensity: 20,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    blurIntensity: 40,
  },
  heavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    blurIntensity: 60,
  },
} as const;

// Export unified theme
const theme = {
  Colors,
  Gradients,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  AnimationConfig,
  Glassmorphism,
} as const;

export type Theme = typeof theme;
export default theme;
