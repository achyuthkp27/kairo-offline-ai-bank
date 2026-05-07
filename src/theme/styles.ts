/**
 * Kairo — Shared StyleSheet Factory
 * Reusable style presets for premium components
 */

import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Glassmorphism } from './tokens';

export const CommonStyles = StyleSheet.create({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glass cards
  glassCard: {
    backgroundColor: Glassmorphism.light.backgroundColor,
    borderWidth: Glassmorphism.light.borderWidth,
    borderColor: Glassmorphism.light.borderColor,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  glassCardMedium: {
    backgroundColor: Glassmorphism.medium.backgroundColor,
    borderWidth: Glassmorphism.medium.borderWidth,
    borderColor: Glassmorphism.medium.borderColor,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },

  // Typography
  textHero: {
    fontFamily: Typography.fontFamily.black,
    fontSize: Typography.fontSize.hero,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  textHeading: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  textTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  textSubtitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  textBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  textCaption: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  textMicro: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.accentBlue,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadows.glowBlue,
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  buttonGhost: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Dividers
  dividerHorizontal: {
    height: 1,
    backgroundColor: Colors.divider,
    width: '100%',
  },

  // Badges
  badge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textPrimary,
  },

  // Input
  input: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.accentBlue,
  },
  inputError: {
    borderColor: Colors.error,
  },
});

export default CommonStyles;
