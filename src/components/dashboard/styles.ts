import { Dimensions, StyleSheet } from 'react-native';
import { BorderRadius, Spacing, Typography } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DashboardColors = {
  background: string;
  accentBlue: string;
  accentCyan: string;
  success: string;
  error: string;
  errorSoft: string;
  gold: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverse: string;
  divider: string;
  cardSurface: string;
  cardBorder: string;
  border: string;
  overlayHeavy: string;
};

export const createDashboardStyles = (Colors: DashboardColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    section: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.base,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    healthScoreContainer: {
      alignItems: 'center',
    },
    seeAllText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.accentBlue,
    },
    widgetsScroll: {
      paddingRight: Spacing.base,
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionItem: {
      width: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.md * 3) / 4,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    actionIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
      position: 'relative',
    },
    iconGlow: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      zIndex: -1,
    },
    actionName: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    analyticsCard: {
      padding: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    analyticsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.xl,
    },
    analyticsValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
    },
    analyticsSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      color: Colors.textTertiary,
      marginTop: 2,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.errorSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    trendText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: 10,
      color: Colors.error,
      marginLeft: 2,
    },
    transactionsCard: {
      paddingVertical: Spacing.xs,
    },
    itemSeparator: {
      height: 1,
      backgroundColor: Colors.divider,
      marginHorizontal: Spacing.base,
    },
    spendingCard: {
      padding: Spacing.xl,
    },
    spendingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.lg,
    },
    spendingTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
    },
    spendingSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      color: Colors.textTertiary,
      marginTop: 2,
    },
    spendingProgressContainer: {
      marginTop: Spacing.sm,
    },
    spendingProgressBar: {
      height: 8,
      backgroundColor: Colors.cardSurface,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    spendingProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    spendingLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    spendingLabelText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
    },
    footerSpacer: {
      height: 100,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: Colors.overlayHeavy,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius['3xl'],
      borderTopRightRadius: BorderRadius['3xl'],
      padding: Spacing.xl,
      paddingBottom: Spacing['4xl'],
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
    modalTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    modalBody: {
      gap: Spacing.xl,
    },
    swipeWrapper: {
      marginTop: Spacing.md,
    },
    inputGroup: {
      gap: Spacing.sm,
    },
    inputLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.cardSurface,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      height: 60,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    textInput: {
      flex: 1,
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
    },
    currencyPrefix: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.accentBlue,
      marginRight: Spacing.sm,
    },
    amountInput: {
      flex: 1,
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize['2xl'],
      color: Colors.textPrimary,
    },
    balanceInfo: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      color: Colors.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },
    confirmButton: {
      backgroundColor: Colors.accentBlue,
      height: 60,
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      shadowColor: Colors.accentBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    disabledButton: {
      opacity: 0.5,
    },
    confirmButtonText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      color: Colors.textInverse,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
      gap: Spacing.md,
    },
    successAmount: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize['4xl'],
      color: Colors.textPrimary,
      marginTop: Spacing.sm,
    },
    successText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    depositMethods: {
      backgroundColor: Colors.cardSurface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    methodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    methodText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
    },
    scannerContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    scannerOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scannerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    scannerCloseButton: {
      padding: Spacing.xs,
    },
    scannerTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: '#fff',
    },
    scanFrameContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanFrame: {
      width: 250,
      height: 250,
      borderWidth: 0,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: Colors.accentCyan,
      borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    scanHint: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: '#fff',
      marginTop: Spacing.xl,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    scannerFooter: {
      padding: Spacing['3xl'],
      alignItems: 'center',
    },
    simulateScanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.accentCyan,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      gap: Spacing.sm,
    },
    simulateScanText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textInverse,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    settingsText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.md,
    },
    modalContainer: {
      flex: 1,
    },
  });
