/**
 * Kairo — Elite Dashboard
 * Luxurious main screen with account carousel, quick actions, and financial insights
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Send, 
  QrCode, 
  Receipt, 
  Plus, 
  CreditCard, 
  PieChart, 
  ArrowUpRight,
  TrendingUp,
  Award,
  Zap,
  Lock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Colors, Typography, Spacing, Shadows, Gradients } from '../../src/theme';
import { useAccountStore, useUIStore, useNotificationStore, useAuthStore } from '../../src/store';
import { useHaptics, useTransactions, useCategorySpending } from '../../src/hooks';
import { DashboardHeader } from '../../src/components/layout/DashboardHeader';
import { AccountCarousel } from '../../src/components/cards/AccountCarousel';
import { AccountDetailWidget } from '../../src/components/layout/AccountDetailWidget';
import { GlassCard } from '../../src/components/common/GlassCard';
import { TransactionItem } from '../../src/components/common/TransactionItem';
import { WeeklyExpenseChart } from '../../src/components/charts/WeeklyExpenseChart';
import { formatCurrency } from '../../src/utils/formatters';
import { InsightEngine, AIInsight } from '../../src/services/InsightEngine';
import { DynamicInsightCard } from '../../src/components/ai/DynamicInsightCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'send', name: 'Send Money', icon: Send, color: Colors.accentBlue },
  { id: 'upi', name: 'UPI Transfer', icon: Zap, color: Colors.accentCyan },
  { id: 'scan', name: 'Scan QR', icon: QrCode, color: Colors.success },
  { id: 'pay', name: 'Pay Bills', icon: Receipt, color: Colors.error },
  { id: 'add', name: 'Add Money', icon: Plus, color: Colors.gold },
  { id: 'fd', name: 'Book FD', icon: CreditCard, color: '#8B5CF6' },
  { id: 'invest', name: 'Investments', icon: TrendingUp, color: Colors.accentCyan },
  { id: 'analytics', name: 'Analytics', icon: PieChart, color: Colors.accentBlue },
];

export default function DashboardScreen() {
  const { 
    accounts, 
    activeAccountIndex, 
    isBalanceVisible, 
    accountDetails,
    setActiveAccount, 
    toggleBalanceVisibility 
  } = useAccountStore();
  
  const { setAISheetVisible, setInitialAIQuery, setNotificationSheetVisible } = useUIStore();
  const { notifications, addNotification } = useNotificationStore();
  const { userId } = useAuthStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const { trigger } = useHaptics();
  const { transactions: recentTransactions, refresh: refreshTxns } = useTransactions(3);
  const { totalSpent, refresh: refreshSpending } = useCategorySpending(7);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    InsightEngine.generateDailyFeed().then(newInsights => {
      setInsights(newInsights);
      
      // Auto-notify for urgent insights
      newInsights.forEach(insight => {
        if (insight.severity === 'alert' || insight.severity === 'warning') {
          const alreadyNotified = notifications.some(n => n.title === insight.title && n.message === insight.description);
          if (!alreadyNotified) {
            addNotification({
              title: insight.title,
              message: insight.description,
              type: insight.type === 'alert' ? 'security' : 'insight'
            });
          }
        }
      });
    });
  }, []);

  const handleAccountChange = useCallback((index: number) => {
    if (index !== activeAccountIndex) {
      setActiveAccount(index);
      trigger('selection');
    }
  }, [activeAccountIndex, setActiveAccount, trigger]);

  const handleActionPress = (actionId: string) => {
    trigger('medium');
    
    switch (actionId) {
      case 'send':
        router.push('/(tabs)/transactions');
        break;
      case 'upi':
        Alert.alert(
          'UPI Transfer', 
          `Ready to send from your ${activeAccount.name}.\n\nDefault ID: achyuth@kairo\nLinked Mobile: +91 91636 00944`,
          [{ text: 'Setup New ID', style: 'default' }, { text: 'Proceed', style: 'cancel' }]
        );
        break;
      case 'scan':
        Alert.alert(
          'Scan QR', 
          'Initializing secure camera module...\n\nKairo will automatically identify the merchant and apply available rewards.',
          [{ text: 'Open Scanner', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
        );
        break;
      case 'pay':
        Alert.alert(
          'Pay Bills', 
          'Upcoming Bills:\n\n• Tata Power: ₹2,450 (Due in 3 days)\n• Airtel Fiber: ₹999 (Due in 5 days)\n• ICICI Credit: ₹18,200 (Due in 12 days)',
          [{ text: 'Pay All', style: 'default' }, { text: 'View Details', style: 'cancel' }]
        );
        break;
      case 'add':
        Alert.alert(
          'Add Money', 
          `Account: ${activeAccount.name}\nNumber: 916360094425\nIFSC: KAIR0001\n\nTransfer via IMPS/NEFT to add funds instantly.`,
          [{ text: 'Copy Details', onPress: () => trigger('success') }, { text: 'Close', style: 'cancel' }]
        );
        break;
      case 'fd':
        Alert.alert(
          'Fixed Deposits', 
          `Current FD: ${accountDetails.fdMaturityStatus}\n\nTop Rates:\n• 1 Year: 7.20% p.a.\n• 3 Years: 7.50% p.a.\n• Senior Citizen: +0.50%`,
          [{ text: 'Book New FD', style: 'default' }, { text: 'Close', style: 'cancel' }]
        );
        break;
      case 'invest':
        router.push('/(tabs)/wealth');
        break;
      case 'analytics':
        router.push('/(tabs)/ai');
        break;
      default:
        console.log('Action pressed:', actionId);
    }
  };

  const activeAccount = accounts[activeAccountIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0A0A0A', '#111111', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      
      <DashboardHeader 
        userName={userId?.replace('27', '') || 'Guest'} 
        notificationCount={unreadCount}
        onNotificationPress={() => {
          trigger('medium');
          setNotificationSheetVisible(true);
        }}
        onLogout={() => {
          trigger('heavy');
          useAuthStore.getState().logout();
          router.replace('/');
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Carousel */}
        <AccountCarousel
          accounts={accounts}
          isBalanceVisible={isBalanceVisible}
          onToggleBalance={() => {
            toggleBalanceVisibility();
            trigger('medium');
          }}
          onAccountChange={handleAccountChange}
        />

        {/* Account Detail Widgets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Insights</Text>
            <Pressable 
              hitSlop={20}
              onPress={() => {
                trigger('light');
                router.push('/ai');
              }}
            >
              <Text style={styles.seeAllText}>Manage</Text>
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.widgetsScroll}
          >
            <AccountDetailWidget
              label="Reward Points"
              value={accountDetails.rewardPoints.toLocaleString()}
              icon={<Award size={14} color={Colors.gold} />}
              subtitle="Elite Member Status"
            />
            <AccountDetailWidget
              label="Credit Score"
              value={accountDetails.creditScore}
              icon={<Lock size={14} color={Colors.success} />}
              subtitle="Excellent Standing"
              progress={82}
              color={Colors.success}
            />
            <AccountDetailWidget
              label="SIP Progress"
              value="₹45,000"
              icon={<TrendingUp size={14} color={Colors.accentCyan} />}
              subtitle="Wealth Builder Plan"
              progress={accountDetails.sipProgress}
              color={Colors.accentCyan}
            />
            <AccountDetailWidget
              label="Cashback"
              value={formatCurrency(accountDetails.cashbackEarned)}
              icon={<ArrowUpRight size={14} color={Colors.accentBlue} />}
              subtitle="This Quarter"
            />
          </ScrollView>
        </View>

        {/* AI Financial Insights Feed */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Daily Insights</Text>
              <Zap size={16} color={Colors.accentBlue} />
            </View>
            {insights.map(insight => (
              <DynamicInsightCard 
                key={insight.id} 
                insight={insight} 
                onPress={() => {
                  trigger('medium');
                  setInitialAIQuery(`Analyze this insight for me: "${insight.description}". \n\nPlease provide a breakdown of the specific transactions, dates, and amounts from my history that led to this conclusion.`);
                  setAISheetVisible(true);
                }} 
              />
            ))}
          </View>
        )}

        {/* Spending Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Analytics</Text>
          <GlassCard variant="medium" style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View>
                <Text style={styles.analyticsValue}>{formatCurrency(totalSpent)}</Text>
                <Text style={styles.analyticsSubtitle}>Total expenses this week</Text>
              </View>
              <View style={styles.trendBadge}>
                <ArrowUpRight size={12} color={Colors.error} />
                <Text style={styles.trendText}>12%</Text>
              </View>
            </View>
            <WeeklyExpenseChart />
          </GlassCard>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleActionPress(action.id)}
                style={styles.actionItem}
              >
                <GlassCard variant="light" style={styles.actionIconWrapper}>
                  <action.icon size={24} color={action.color} strokeWidth={1.5} />
                  <View style={[styles.iconGlow, { backgroundColor: action.color, opacity: 0.15 }]} />
                </GlassCard>
                <Text style={styles.actionName}>{action.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Monthly Spending Limit Card */}
        <View style={styles.section}>
          <GlassCard variant="medium" style={styles.spendingCard}>
            <View style={styles.spendingHeader}>
              <View>
                <Text style={styles.spendingTitle}>Monthly Spending Limit</Text>
                <Text style={styles.spendingSubtitle}>You've used 68% of your budget</Text>
              </View>
              <PieChart size={24} color={Colors.accentBlue} />
            </View>
            
            <View style={styles.spendingProgressContainer}>
              <View style={styles.spendingProgressBar}>
                <LinearGradient
                  colors={[Colors.accentBlue, Colors.accentCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.spendingProgressFill, { width: '68%' }]}
                />
              </View>
              <View style={styles.spendingLabels}>
                <Text style={styles.spendingLabelText}>₹85,000 spent</Text>
                <Text style={styles.spendingLabelText}>₹1,25,000 limit</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable 
              hitSlop={20}
              onPress={() => router.push('/transactions')}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </Pressable>
          </View>
          <GlassCard variant="light" style={styles.transactionsCard}>
            {recentTransactions.slice(0, 3).map((item, index) => (
              <React.Fragment key={item.id}>
                <TransactionItem 
                  transaction={item} 
                  onPress={() => trigger('light')} 
                />
                {index < 2 && <View style={styles.itemSeparator} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    height: 40,
  },
});
