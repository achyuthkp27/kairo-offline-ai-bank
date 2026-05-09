/**
 * Kairo — Wealth Screen
 * Premium wealth management with real data from database
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { TrendingUp, PieChart, Briefcase, Landmark, Coins, Target, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Plus, Eye, Edit, Trash2, X, Save } from 'lucide-react-native';

import { Typography, Spacing } from '../../src/theme';
import { useHaptics, usePortfolio, useNetWorth, useAccounts, useSavingsGoals, useBills, useDebts } from '../../src/hooks';
import { useThemeColors } from '../../src/hooks/useTheme';
import { GlassCard } from '../../src/components/common/GlassCard';
import { AssetAllocationChart, AssetDataItem } from '../../src/components/charts/RotatablePieChart';
import { withErrorBoundary } from '../../src/components/common/ErrorBoundary';

function WealthScreen() {
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalMonths, setNewGoalMonths] = useState('12');
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const router = useRouter();
  const { trigger } = useHaptics();
  const { Colors } = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const { portfolio, refresh: refreshPortfolio } = usePortfolio();
  const { netWorth, refresh: refreshNetWorth } = useNetWorth();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { goals, refresh: refreshGoals, addGoal, deleteGoal, addToGoal } = useSavingsGoals();
  const { bills, refresh: refreshBills } = useBills();
  const { debts, refresh: refreshDebts } = useDebts();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshNetWorth(), refreshPortfolio(), refreshAccounts(), refreshGoals(), refreshBills(), refreshDebts()]);
    setRefreshing(false);
    trigger('success');
  }, [refreshNetWorth, refreshPortfolio, refreshAccounts, refreshGoals, refreshBills, refreshDebts, trigger]);

  const handleViewAllAccounts = useCallback(() => {
    trigger('selection');
    router.push('/accounts');
  }, [router, trigger]);

  const handleAddAccount = useCallback(() => {
    trigger('selection');
    Alert.alert('Add Account', 'Add a new bank account to track.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'default' },
    ]);
  }, [trigger]);

  const handleAddSavingsGoal = useCallback(() => {
    trigger('selection');
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalMonths('12');
    setShowAddGoalModal(true);
  }, [trigger]);

  const handleSaveGoal = useCallback(async () => {
    if (!newGoalName.trim() || !newGoalTarget || parseFloat(newGoalTarget) <= 0) {
      trigger('error');
      return;
    }
    try {
      const target = parseFloat(newGoalTarget);
      const months = parseInt(newGoalMonths) || 12;
      const deadline = Date.now() + (months * 30 * 24 * 60 * 60 * 1000);
      const monthlyContribution = target / months;
      
      await addGoal(newGoalName.trim(), target, deadline, 'general', monthlyContribution);
      setShowAddGoalModal(false);
      trigger('success');
    } catch (e) {
      trigger('error');
    }
  }, [newGoalName, newGoalTarget, newGoalMonths, addGoal, trigger]);

  const handleAddToGoal = useCallback((goalId: string, goalName: string, current: number, target: number) => {
    trigger('selection');
    Alert.prompt('Add Savings', `How much to add to "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: async (amount?: string) => {
        const num = parseFloat(amount || '0');
        if (num > 0) {
          try {
            await addToGoal(goalId, num);
            trigger('success');
          } catch (e) {
            trigger('error');
          }
        }
      }},
    ]);
  }, [addToGoal, trigger]);

  const handleViewAllBills = useCallback(() => {
    trigger('selection');
    router.push('/bills');
  }, [router, trigger]);

  const handleManageLiabilities = useCallback(() => {
    trigger('selection');
    Alert.alert('Manage Liabilities', 'Track and manage your debts and loans.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Coming Soon', style: 'default' },
    ]);
  }, [trigger]);

  const handleAddInvestment = useCallback(() => {
    trigger('selection');
    Alert.alert('Add Investment', 'Add a new investment to track.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'default' },
    ]);
  }, [trigger]);

  const handleViewAccount = useCallback((accountId: string) => {
    trigger('selection');
    Alert.alert('Account Details', `View details for account ${accountId}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'default' },
    ]);
  }, [trigger]);

  const handleViewGoal = useCallback((goal: any) => {
    trigger('selection');
    setSelectedGoal(goal);
    setAddMoneyAmount('');
    setShowGoalModal(true);
  }, [trigger]);

  const handleDeleteGoal = useCallback(async () => {
    if (!selectedGoal) return;
    try {
      await deleteGoal(selectedGoal.id);
      setShowGoalModal(false);
      setSelectedGoal(null);
      trigger('success');
    } catch (e) {
      trigger('error');
    }
  }, [selectedGoal, deleteGoal, trigger]);

  const handleAddMoney = useCallback(async () => {
    if (!selectedGoal || !addMoneyAmount || parseFloat(addMoneyAmount) <= 0) {
      trigger('error');
      return;
    }
    const amount = parseFloat(addMoneyAmount);
    try {
      // First update local state immediately for better UX
      setSelectedGoal((prev: any) => ({
        ...prev,
        currentAmount: prev.currentAmount + amount,
      }));
      setAddMoneyAmount('');
      
      // Then save to DB
      await addToGoal(selectedGoal.id, amount);
      
      trigger('success');
    } catch (e) {
      // Revert if error
      setSelectedGoal((prev: any) => ({
        ...prev,
        currentAmount: prev.currentAmount - amount,
      }));
      trigger('error');
    }
  }, [selectedGoal, addMoneyAmount, addToGoal, trigger]);

  const handleViewBill = useCallback((billId: string) => {
    trigger('selection');
    Alert.alert('Bill Details', `View bill ${billId}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay Now', onPress: () => trigger('success') },
    ]);
  }, [trigger]);

  const handleViewDebt = useCallback((debtId: string) => {
    trigger('selection');
    Alert.alert('Debt Details', `Manage debt ${debtId}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Make Payment', onPress: () => trigger('success') },
    ]);
  }, [trigger]);

  const handleViewInvestment = useCallback((investmentId: string) => {
    trigger('selection');
    Alert.alert('Investment Details', `View details for investment ${investmentId}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'default' },
    ]);
  }, [trigger]);

  const totalAssets = useMemo(() => {
    const portfolioValue = portfolio.reduce((sum, p) => sum + p.value, 0);
    const accountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    return portfolioValue + accountBalance;
  }, [portfolio, accounts]);

  const totalLiabilities = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.currentBalance, 0);
  }, [debts]);

  const totalSavings = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [goals]);

  const upcomingBills = useMemo(() => {
    const now = Date.now();
    return bills.filter(b => b.dueDate > now && b.dueDate - now < 7 * 24 * 60 * 60 * 1000);
  }, [bills]);

  const PORTFOLIO_COLORS: Record<string, string> = {
    stocks: Colors.accentBlue,
    mutual_funds: '#8B5CF6',
    fixed_deposits: Colors.success,
    crypto: Colors.accentCyan,
    bonds: '#F59E0B',
    real_estate: '#EC4899',
    gold: '#EAB308',
    cash: Colors.textSecondary,
  };

  const COMPANY_LOGOS: Record<string, { emoji: string; bg: string }> = {
    NFLX: { emoji: '🎬', bg: '#E50914' },
    AAPL: { emoji: '🍎', bg: '#A2AAAD' },
    SPOT: { emoji: '🎵', bg: '#1DB954' },
    GOOGL: { emoji: '▶️', bg: '#FF0000' },
    MSFT: { emoji: '🪟', bg: '#00A4EF' },
    AMZN: { emoji: '📦', bg: '#FF9900' },
    TSLA: { emoji: '🚗', bg: '#CC0000' },
    META: { emoji: '📘', bg: '#0668E1' },
  };

  const getCompanyLogo = (symbol?: string) => {
    if (!symbol) return null;
    return COMPANY_LOGOS[symbol] || null;
  };

  const ASSET_DESCRIPTIONS: Record<string, string> = {
    stocks: 'Equity holdings',
    mutual_funds: 'Mutual fund investments',
    fixed_deposits: 'Term deposits',
    crypto: 'Digital assets',
    bonds: 'Bond investments',
    real_estate: 'Property',
    gold: 'Gold ETFs',
    cash: 'Liquid funds',
  };

  const portfolioData: AssetDataItem[] = useMemo(() => {
    return portfolio.map((item) => ({
      label: item.label,
      value: item.value,
      color: PORTFOLIO_COLORS[item.category] || Colors.accentBlue,
      description: ASSET_DESCRIPTIONS[item.category] || 'Investment',
    }));
  }, [portfolio]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
    headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textPrimary },
    headerSubtitle: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textTertiary, marginTop: 2 },
    scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    netWorthCard: { padding: Spacing.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
    netWorthLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
    netWorthValue: { fontFamily: Typography.fontFamily.black, fontSize: 36, color: Colors.textPrimary, letterSpacing: -1, marginTop: Spacing.xs },
    netWorthChange: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
    changeText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, marginLeft: 4 },
    statsRow: { flexDirection: 'row', marginTop: Spacing.lg, gap: Spacing.md },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: Spacing.md },
    statLabel: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginTop: 4 },
    section: { marginBottom: Spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.xs },
    sectionAction: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.accentBlue, paddingVertical: 4, paddingHorizontal: 8 },
    sectionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    chartCard: { padding: Spacing.lg, marginTop: Spacing.xs, marginBottom: Spacing.md },
    chartWrapper: { alignItems: 'center', paddingVertical: Spacing.lg },
    accountCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    accountIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    accountIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    accountInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
    accountName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    accountType: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
    accountBalance: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, textAlign: 'right' },
    goalCard: { padding: Spacing.md, marginBottom: Spacing.sm },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    goalTitleWrap: { flex: 1, marginRight: Spacing.md },
    goalName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    goalTarget: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
    goalPercent: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.success },
    progressBar: { height: 6, backgroundColor: Colors.backgroundTertiary, borderRadius: 3, marginTop: Spacing.md },
    progressFill: { height: 6, borderRadius: 3 },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
    goalAmount: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
    goalDate: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
    billCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    billIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    billInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
    billName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    billDue: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
    billAmount: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, textAlign: 'right' },
    debtCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    debtIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    debtInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
    debtName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    debtDetail: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
    debtAmount: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.error, textAlign: 'right' },
    emptyText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
    moreCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, borderStyle: 'dashed' },
    moreText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginLeft: Spacing.sm },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalBackdrop: { display: 'none' },
    modalContentWrapper: { width: '90%', maxWidth: 400 },
    modalContent: { padding: Spacing.xl, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    modalTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
    modalBody: { marginBottom: Spacing.xl },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
    modalCancelBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
    modalCancelText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textSecondary },
    modalSaveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: 12, backgroundColor: Colors.accentBlue, gap: Spacing.sm },
    modalSaveText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: '#FFFFFF' },
    inputLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: { backgroundColor: Colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    goalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    goalDetailLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
    goalDetailValue: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    progressText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.success, textAlign: 'center', marginTop: Spacing.sm },
    addMoneyRow: { flexDirection: 'row', gap: Spacing.sm },
    addMoneyBtn: { backgroundColor: Colors.success, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: 12, justifyContent: 'center' },
    addMoneyBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: '#FFFFFF' },
  }), [Colors]);

  const formatCompact = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const formatFull = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getDaysUntil = (timestamp: number): string => {
    const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Overdue';
    return `${days} days`;
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'savings': return Wallet;
      case 'credit': return CreditCard;
      case 'investment': return TrendingUp;
      default: return Wallet;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wealth</Text>
          <Text style={styles.headerSubtitle}>Your financial overview</Text>
        </View>

        {/* Net Worth Card */}
        <GlassCard variant="heavy" style={styles.netWorthCard}>
          <LinearGradient colors={[Colors.accentBlue + '40', Colors.accentCyan + '20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.netWorthValue}>{formatCompact(netWorth)}</Text>
          <View style={styles.netWorthChange}>
            <ArrowUpRight size={16} color={Colors.success} />
            <Text style={[styles.changeText, { color: Colors.success }]}>+12.5% this month</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Assets</Text>
              <Text style={styles.statValue}>{formatCompact(totalAssets)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Liabilities</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>{formatCompact(totalLiabilities)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Savings</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>{formatCompact(totalSavings)}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Bank Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <Pressable onPress={handleViewAllAccounts} style={styles.sectionActionBtn}>
              <Text style={styles.sectionAction}>See all</Text>
              <ArrowUpRight size={14} color={Colors.accentBlue} />
            </Pressable>
          </View>
          {accounts.length > 0 ? (
            accounts.slice(0, 3).map((account, index) => {
              const IconComponent = getAccountIcon(account.type);
              return (
                <Pressable key={account.id} onPress={() => handleViewAccount(account.id)}>
                  <GlassCard variant="light" style={styles.accountCard}>
                    <View style={[styles.accountIconWrap, { backgroundColor: Colors.accentBlue + '20' }]}>
                      <IconComponent size={22} color={Colors.accentBlue} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>{account.type} • {account.cardNetwork || 'Bank'}</Text>
                    </View>
                    <Text style={styles.accountBalance}>{formatCompact(account.balance)}</Text>
                  </GlassCard>
                </Pressable>
              );
            })
          ) : (
            <Pressable onPress={handleAddAccount}>
              <GlassCard variant="light" style={styles.moreCard}>
                <Plus size={24} color={Colors.textMuted} />
                <Text style={styles.moreText}>Add your first account</Text>
              </GlassCard>
            </Pressable>
          )}
        </View>

        {/* Asset Allocation */}
        {portfolioData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Allocation</Text>
            <GlassCard variant="light" style={styles.chartCard}>
              <View style={styles.chartWrapper}>
                <AssetAllocationChart data={portfolioData} size={180} />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Savings Goals */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Savings Goals</Text>
              <Pressable onPress={handleAddSavingsGoal} style={styles.sectionActionBtn}>
                <Plus size={14} color={Colors.accentBlue} />
                <Text style={styles.sectionAction}>Add new</Text>
              </Pressable>
            </View>
            {goals.slice(0, 3).map((goal, index) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const daysLeft = Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Pressable key={goal.id} onPress={() => handleViewGoal(goal)}>
                  <GlassCard variant="light" style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalTitleWrap}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.goalTarget}>Target: {formatCompact(goal.targetAmount)}</Text>
                      </View>
                      <Text style={styles.goalPercent}>{progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: Colors.success }]} />
                    </View>
                    <View style={styles.goalFooter}>
                      <Text style={styles.goalAmount}>{formatCompact(goal.currentAmount)} saved</Text>
                      <Text style={styles.goalDate}>{daysLeft > 0 ? `${daysLeft} days left` : 'Due'}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bills</Text>
              <Pressable onPress={handleViewAllBills} style={styles.sectionActionBtn}>
                <Text style={styles.sectionAction}>See all</Text>
                <ArrowUpRight size={14} color={Colors.accentBlue} />
              </Pressable>
            </View>
            {upcomingBills.slice(0, 3).map((bill, index) => (
              <Pressable key={bill.id} onPress={() => handleViewBill(bill.id)}>
                <GlassCard variant="light" style={styles.billCard}>
                  <View style={[styles.billIconWrap, { backgroundColor: Colors.warning + '20' }]}>
                    <Receipt size={22} color={Colors.warning} />
                  </View>
                  <View style={styles.billInfo}>
                    <Text style={styles.billName}>{bill.name}</Text>
                    <Text style={styles.billDue}>Due {getDaysUntil(bill.dueDate)}</Text>
                  </View>
                  <Text style={styles.billAmount}>{formatCompact(bill.amount)}</Text>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        )}

        {/* Liabilities / Debts */}
        {debts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Liabilities</Text>
              <Pressable onPress={handleManageLiabilities} style={styles.sectionActionBtn}>
                <Text style={styles.sectionAction}>Manage</Text>
                <Edit size={14} color={Colors.accentBlue} />
              </Pressable>
            </View>
            {debts.slice(0, 3).map((debt, index) => (
              <Pressable key={debt.id} onPress={() => handleViewDebt(debt.id)}>
                <GlassCard variant="light" style={styles.debtCard}>
                  <View style={[styles.debtIconWrap, { backgroundColor: Colors.error + '20' }]}>
                    <CreditCard size={22} color={Colors.error} />
                  </View>
                  <View style={styles.debtInfo}>
                    <Text style={styles.debtName}>{debt.name}</Text>
                    <Text style={styles.debtDetail}>{debt.interestRate}% APR • Min ₹{debt.minimumPayment.toLocaleString('en-IN')}/mo</Text>
                  </View>
                  <Text style={styles.debtAmount}>{formatCompact(debt.currentBalance)}</Text>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        )}

        {/* Investments Summary */}
        {portfolio.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Investments</Text>
              <Pressable onPress={handleAddInvestment} style={styles.sectionActionBtn}>
                <Plus size={14} color={Colors.accentBlue} />
                <Text style={styles.sectionAction}>Add more</Text>
              </Pressable>
            </View>
            {portfolio.slice(0, 4).map((item, index) => {
              const logo = getCompanyLogo(item.companySymbol);
              return (
                <Pressable key={item.id} onPress={() => handleViewInvestment(item.id)}>
                  <GlassCard variant="light" style={styles.accountCard}>
                    {logo ? (
                      <View style={[styles.accountIconWrap, { backgroundColor: logo.bg + '30' }]}>
                        <Text style={{ fontSize: 24 }}>{logo.emoji}</Text>
                      </View>
                    ) : (
                      <View style={[styles.accountIconWrap, { backgroundColor: (PORTFOLIO_COLORS[item.category] || Colors.accentBlue) + '20' }]}>
                        <TrendingUp size={22} color={PORTFOLIO_COLORS[item.category] || Colors.accentBlue} />
                      </View>
                    )}
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{item.label}</Text>
                      <Text style={styles.accountType}>{item.companySymbol || item.category.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.accountBalance}>{formatCompact(item.value)}</Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {portfolio.length === 0 && accounts.length === 0 && goals.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <PiggyBank size={48} color={Colors.textMuted} />
            <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>No wealth data yet</Text>
            <Text style={[styles.emptyText, { fontSize: Typography.fontSize.sm }]}>Add accounts and investments to see your wealth overview</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Savings Goal Modal */}
      <Modal visible={showAddGoalModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddGoalModal(false)} />
          <View style={styles.modalContentWrapper}>
            <GlassCard variant="heavy" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Savings Goal</Text>
                <Pressable onPress={() => setShowAddGoalModal(false)} hitSlop={8}>
                  <X size={24} color={Colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Goal Name</Text>
                <TextInput
                  style={styles.input}
                  value={newGoalName}
                  onChangeText={setNewGoalName}
                  placeholder="e.g., Emergency Fund"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Target Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={newGoalTarget}
                  onChangeText={setNewGoalTarget}
                  placeholder="100000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Months to achieve</Text>
                <TextInput
                  style={styles.input}
                  value={newGoalMonths}
                  onChangeText={setNewGoalMonths}
                  placeholder="12"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalFooter}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowAddGoalModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSaveBtn} onPress={handleSaveGoal}>
                  <Save size={18} color="#FFFFFF" />
                  <Text style={styles.modalSaveText}>Create</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Goal Detail Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGoalModal(false)} />
          <View style={styles.modalContentWrapper}>
            <GlassCard variant="heavy" style={styles.modalContent}>
              {selectedGoal && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedGoal.name}</Text>
                    <Pressable onPress={() => setShowGoalModal(false)} hitSlop={8}>
                      <X size={24} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                  
                  <View style={styles.goalDetailRow}>
                    <Text style={styles.goalDetailLabel}>Target</Text>
                    <Text style={styles.goalDetailValue}>{formatFull(selectedGoal.targetAmount)}</Text>
                  </View>
                  <View style={styles.goalDetailRow}>
                    <Text style={styles.goalDetailLabel}>Saved</Text>
                    <Text style={[styles.goalDetailValue, { color: Colors.success }]}>{formatFull(selectedGoal.currentAmount)}</Text>
                  </View>
                  <View style={styles.goalDetailRow}>
                    <Text style={styles.goalDetailLabel}>Remaining</Text>
                    <Text style={styles.goalDetailValue}>{formatFull(selectedGoal.targetAmount - selectedGoal.currentAmount)}</Text>
                  </View>
                  <View style={styles.goalDetailRow}>
                    <Text style={styles.goalDetailLabel}>Monthly</Text>
                    <Text style={styles.goalDetailValue}>{formatFull(selectedGoal.monthlyContribution)}</Text>
                  </View>
                  <View style={styles.goalDetailRow}>
                    <Text style={styles.goalDetailLabel}>Deadline</Text>
                    <Text style={styles.goalDetailValue}>
                      {new Date(selectedGoal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}%`, backgroundColor: Colors.success }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}% complete
                  </Text>

                  <View style={styles.modalBody}>
                    <Text style={styles.inputLabel}>Add Money</Text>
                    <View style={styles.addMoneyRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={addMoneyAmount}
                        onChangeText={setAddMoneyAmount}
                        placeholder="Enter amount"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                      />
                      <Pressable style={styles.addMoneyBtn} onPress={handleAddMoney}>
                        <Text style={styles.addMoneyBtnText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <Pressable style={[styles.modalCancelBtn, { borderColor: Colors.error }]} onPress={handleDeleteGoal}>
                      <Trash2 size={18} color={Colors.error} />
                      <Text style={[styles.modalCancelText, { color: Colors.error }]}>Delete</Text>
                    </Pressable>
                    <Pressable style={styles.modalSaveBtn} onPress={() => setShowGoalModal(false)}>
                      <Text style={styles.modalSaveText}>Done</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default withErrorBoundary(WealthScreen);