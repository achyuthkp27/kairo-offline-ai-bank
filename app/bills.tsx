/**
 * Kairo — Bills Screen
 * View and manage upcoming bills
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Receipt, Plus, ArrowLeft, Clock, CheckCircle } from 'lucide-react-native';

import { Typography, Spacing } from '../src/theme';
import { useBills, useHaptics } from '../src/hooks';
import { useThemeColors } from '../src/hooks/useTheme';
import { GlassCard } from '../src/components/common/GlassCard';
import { withErrorBoundary } from '../src/components/common/ErrorBoundary';

function BillsScreen() {
  const router = useRouter();
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const { bills, isLoading } = useBills();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backBtn: { padding: Spacing.xs, marginRight: Spacing.md },
    headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
    scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    totalCard: { padding: Spacing.xl, marginBottom: Spacing.xl },
    totalLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
    totalValue: { fontFamily: Typography.fontFamily.black, fontSize: 32, color: Colors.warning, marginTop: Spacing.xs },
    sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.md },
    billCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    billIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    billInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
    billName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    billDue: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
    billAmount: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, textAlign: 'right' },
    emptyText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
    addCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, borderStyle: 'dashed' },
    addText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginLeft: Spacing.sm },
  }), [Colors]);

  const formatCompact = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const getDaysUntil = (timestamp: number): string => {
    const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Overdue';
    return `${days} days`;
  };

  const totalDue = bills.reduce((sum, b) => sum + b.amount, 0);
  const unpaidBills = bills.filter(b => !b.isPaid);
  const overdueBills = unpaidBills.filter(b => b.dueDate < Date.now());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bills</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GlassCard variant="heavy" style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>{formatCompact(totalDue)}</Text>
          {overdueBills.length > 0 && (
            <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.error, marginTop: Spacing.xs }}>
              {overdueBills.length} overdue
            </Text>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>Upcoming Bills</Text>

        {unpaidBills.length > 0 ? (
          unpaidBills.map((bill) => {
            const isOverdue = bill.dueDate < Date.now();
            return (
              <GlassCard key={bill.id} variant="light" style={styles.billCard}>
                <View style={[styles.billIcon, { backgroundColor: (isOverdue ? Colors.error : Colors.warning) + '20' }]}>
                  {isOverdue ? <Clock size={24} color={Colors.error} /> : <Receipt size={24} color={Colors.warning} />}
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={[styles.billDue, { color: isOverdue ? Colors.error : Colors.textMuted }]}>
                    Due {getDaysUntil(bill.dueDate)}
                  </Text>
                </View>
                <Text style={styles.billAmount}>{formatCompact(bill.amount)}</Text>
              </GlassCard>
            );
          })
        ) : (
          <GlassCard variant="light" style={styles.addCard}>
            <CheckCircle size={24} color={Colors.success} />
            <Text style={styles.addText}>No pending bills</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(BillsScreen);