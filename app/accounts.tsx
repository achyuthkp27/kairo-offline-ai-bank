/**
 * Kairo — Accounts Screen
 * View and manage all accounts
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wallet, CreditCard, TrendingUp, Plus, ArrowLeft } from 'lucide-react-native';

import { Typography, Spacing } from '../src/theme';
import { useAccounts, useHaptics } from '../src/hooks';
import { useThemeColors } from '../src/hooks/useTheme';
import { GlassCard } from '../src/components/common/GlassCard';
import { withErrorBoundary } from '../src/components/common/ErrorBoundary';

function AccountsScreen() {
  const router = useRouter();
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const { accounts, isLoading } = useAccounts();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backBtn: { padding: Spacing.xs, marginRight: Spacing.md },
    headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
    scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    totalCard: { padding: Spacing.xl, marginBottom: Spacing.xl },
    totalLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
    totalValue: { fontFamily: Typography.fontFamily.black, fontSize: 32, color: Colors.textPrimary, marginTop: Spacing.xs },
    sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.md },
    accountCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    accountIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    accountInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
    accountName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    accountType: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
    accountBalance: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, textAlign: 'right' },
    emptyText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
    addCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, borderStyle: 'dashed' },
    addText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginLeft: Spacing.sm },
  }), [Colors]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'savings': return Wallet;
      case 'credit': return CreditCard;
      case 'investment': return TrendingUp;
      default: return Wallet;
    }
  };

  const formatCompact = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Accounts</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GlassCard variant="heavy" style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalValue}>{formatCompact(totalBalance)}</Text>
        </GlassCard>

        <Text style={styles.sectionTitle}>All Accounts</Text>

        {accounts.length > 0 ? (
          accounts.map((account) => {
            const IconComponent = getAccountIcon(account.type);
            return (
              <GlassCard key={account.id} variant="light" style={styles.accountCard}>
                <View style={[styles.accountIcon, { backgroundColor: Colors.accentBlue + '20' }]}>
                  <IconComponent size={24} color={Colors.accentBlue} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>{account.type} • {account.cardNetwork || 'Bank'}</Text>
                </View>
                <Text style={styles.accountBalance}>{formatCompact(account.balance)}</Text>
              </GlassCard>
            );
          })
        ) : (
          <Pressable onPress={() => trigger('selection')}>
            <GlassCard variant="light" style={styles.addCard}>
              <Plus size={24} color={Colors.textMuted} />
              <Text style={styles.addText}>Add your first account</Text>
            </GlassCard>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(AccountsScreen);