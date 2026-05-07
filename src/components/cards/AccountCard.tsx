/**
 * Kairo — Account Card
 * Premium banking card with glassmorphism, gradients, and animated interactions
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { Svg, Rect, Path } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatCurrency, formatMaskedCurrency } from '../../utils/formatters';
import { Account } from '../../store/accountStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = 200;

interface AccountCardProps {
  account: Account;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  onPress?: () => void;
}

const CardChip = () => (
  <Svg width="40" height="30" viewBox="0 0 40 30" fill="none">
    <Rect x="0.5" y="0.5" width="39" height="29" rx="5.5" stroke="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.1)" />
    <Path d="M0 10H10M0 20H10M30 10H40M30 20H40M15 0V30M25 0V30" stroke="rgba(255,255,255,0.3)" />
    <Rect x="12" y="8" width="16" height="14" rx="2" fill="rgba(255,255,255,0.2)" />
  </Svg>
);

const MastercardLogo = () => (
  <Svg width="40" height="24" viewBox="0 0 40 24" fill="none">
    <Rect width="40" height="24" rx="4" fill="transparent" />
    <Path d="M15 12C15 15.3137 12.3137 18 9 18C5.68629 18 3 15.3137 3 12C3 8.68629 5.68629 6 9 6C12.3137 6 15 8.68629 15 12Z" fill="#EB001B" opacity="0.8" />
    <Path d="M25 12C25 15.3137 22.3137 18 19 18C15.6863 18 13 15.3137 13 12C13 8.68629 15.6863 6 19 6C22.3137 6 25 8.68629 25 12Z" fill="#F79E1B" opacity="0.8" />
  </Svg>
);

const VisaLogo = () => (
  <View style={styles.visaContainer}>
    <Text style={styles.visaText}>VISA</Text>
  </View>
);

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isBalanceVisible,
  onToggleBalance,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={account.gradientColors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, account.isActive && styles.activeCard]}
      >
        {/* Shine effect overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <View>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountType}>{account.type.toUpperCase()}</Text>
          </View>
          {account.cardBrand === 'visa' ? <VisaLogo /> : <MastercardLogo />}
        </View>

        <View style={styles.chipRow}>
          <CardChip />
        </View>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              {isBalanceVisible
                ? formatCurrency(account.balance, account.currency)
                : formatMaskedCurrency(account.currency)}
            </Text>
            <Pressable onPress={onToggleBalance} style={styles.eyeButton}>
              {isBalanceVisible ? (
                <EyeOff size={20} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
              ) : (
                <Eye size={20} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.cardNumber}>{account.cardNumber}</Text>
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryLabel}>EXP</Text>
            <Text style={styles.expiryValue}>{account.expiryDate}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    marginHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...Shadows.md,
  },
  activeCard: {
    ...Shadows.glowBlue,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  accountType: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginTop: 2,
  },
  visaContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  visaText: {
    color: '#fff',
    fontFamily: Typography.fontFamily.black,
    fontSize: 18,
    fontStyle: 'italic',
  },
  chipRow: {
    marginTop: Spacing.md,
  },
  balanceContainer: {
    marginTop: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  eyeButton: {
    marginLeft: Spacing.md,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumber: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
  },
  expiryContainer: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  expiryValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
});
