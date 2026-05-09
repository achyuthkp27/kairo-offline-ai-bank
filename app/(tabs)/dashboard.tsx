/**
 * Kairo — Elite Dashboard
 * Luxurious main screen with account carousel, quick actions, and financial insights
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  QrCode, 
  PieChart, 
  ArrowUpRight,
  TrendingUp,
  Award,
  Zap,
  Lock,
  RefreshCw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CheckCircle2, X, Wallet, User, ArrowDownLeft, Settings } from 'lucide-react-native';

import { useAccountStore, useUIStore, useNotificationStore, useAuthStore } from '../../src/store';
import {
  useHaptics,
  useTransactions,
  useCategorySpending,
  useNetWorth,
  useThemeColors,
  useDashboardTransfers,
  useNotificationBootstrap,
  useDashboardInsights,
  useDailySpending,
} from '../../src/hooks';
import { BudgetWidget } from '../../src/components/budget/BudgetWidget';
import { DashboardHeader } from '../../src/components/layout/DashboardHeader';
import { AccountCarousel } from '../../src/components/cards/AccountCarousel';
import { AccountDetailWidget } from '../../src/components/layout/AccountDetailWidget';
import { GlassCard } from '../../src/components/common/GlassCard';
import { TransactionItem } from '../../src/components/common/TransactionItem';
import { SwipeToPay } from '../../src/components/common/SwipeToPay';
import { CustomRefreshControl } from '../../src/components/common/CustomRefreshControl';
import { FinancialHealthScore } from '../../src/components/gamification/FinancialHealthScore';
import { SavingsStreak } from '../../src/components/gamification/SavingsStreak';
import { AchievementBadges, MOCK_ACHIEVEMENTS } from '../../src/components/gamification/AchievementBadges';
import { WeeklyExpenseChart } from '../../src/components/charts/WeeklyExpenseChart';
import { formatCurrency } from '../../src/utils/formatters';
import { DynamicInsightCard } from '../../src/components/ai/DynamicInsightCard';
import { NotificationSettings } from '../../src/components/notifications/NotificationSettings';
import { getDashboardGradientColors, getQuickActions } from '../../src/components/dashboard/constants';
import { createDashboardStyles } from '../../src/components/dashboard/styles';
import { Spacing } from '../../src/theme';

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
  const { data: dailySpending, refresh: refreshDaily } = useDailySpending(7);
  const { refresh: refreshNetWorth } = useNetWorth();
  const { Colors, isDark } = useThemeColors();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useNotificationBootstrap();
  const { insights } = useDashboardInsights({ notifications, addNotification });
  
  const QUICK_ACTIONS = useMemo(
    () => getQuickActions(Colors),
    [Colors]
  );
  const gradientColors = useMemo(() => getDashboardGradientColors(isDark), [isDark]);
  const styles = useMemo(() => createDashboardStyles(Colors), [Colors]);
  
  const {
    transferModalVisible,
    setTransferModalVisible,
    addMoneyModalVisible,
    setAddMoneyModalVisible,
    transferAmount,
    setTransferAmount,
    transferRecipient,
    setTransferRecipient,
    isProcessing,
    transferSuccess,
    scannerVisible,
    setScannerVisible,
    handleBarCodeScanned,
    handleActionPress,
    executeTransfer,
    executeAddMoney,
  } = useDashboardTransfers({
    fdMaturityStatus: accountDetails.fdMaturityStatus,
    trigger,
    refreshTxns,
    refreshSpending: () => {
      refreshSpending();
      refreshDaily();
    },
    refreshNetWorth,
    onNavigateWealth: () => router.push('/wealth'),
    onNavigateAi: () => router.push('/ai'),
  });

  const handleAccountChange = useCallback((index: number) => {
    if (index !== activeAccountIndex) {
      setActiveAccount(index);
      trigger('selection');
    }
  }, [activeAccountIndex, setActiveAccount, trigger]);

  const activeAccount = accounts[activeAccountIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradientColors}
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
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              trigger('light');
              refreshTxns();
              refreshSpending();
              refreshDaily();
              refreshNetWorth();
            }}
            tintColor={Colors.accentBlue}
            colors={[Colors.accentBlue]}
          />
        }
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
            <WeeklyExpenseChart data={dailySpending} />
          </GlassCard>
        </View>

        {/* Budget Overview */}
        <View style={styles.section}>
          <BudgetWidget />
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
                accessibilityRole="button"
                accessibilityLabel={action.name}
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

        {/* Financial Health Score */}
        <View style={styles.section}>
          <GlassCard variant="light">
            <FinancialHealthScore score={78} size={140} />
          </GlassCard>
        </View>

        {/* Savings Streak */}
        <View style={styles.section}>
          <GlassCard variant="light">
            <SavingsStreak currentStreak={5} bestStreak={12} />
          </GlassCard>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <GlassCard variant="light">
            <AchievementBadges achievements={MOCK_ACHIEVEMENTS} />
          </GlassCard>
        </View>

        {/* Settings Link */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setShowNotificationSettings(true)}
            style={[styles.settingsButton, { backgroundColor: Colors.cardSurface }]}
          >
            <Settings size={20} color={Colors.textSecondary} />
            <Text style={[styles.settingsText, { color: Colors.textSecondary }]}>
              Notification Settings
            </Text>
          </Pressable>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={scannerVisible}
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          
          <SafeAreaView style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <Pressable
                onPress={() => setScannerVisible(false)}
                style={styles.scannerCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close QR scanner"
              >
                <X size={28} color="#fff" />
              </Pressable>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanHint}>Align QR code within the frame</Text>
            </View>

            <View style={styles.scannerFooter}>
              <TouchableOpacity 
                style={styles.simulateScanButton}
                onPress={() => handleBarCodeScanned({ data: 'Blue Tokai Coffee' })}
              >
                <QrCode size={20} color="#000" />
                <Text style={styles.simulateScanText}>Simulate Scan</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Transfer Money Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={transferModalVisible}
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="medium" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{transferSuccess ? 'Transfer Success' : 'Transfer Money'}</Text>
              <Pressable
                onPress={() => setTransferModalVisible(false)}
                hitSlop={15}
                accessibilityRole="button"
                accessibilityLabel="Close transfer dialog"
              >
                <X size={24} color={Colors.textTertiary} />
              </Pressable>
            </View>

            {transferSuccess ? (
              <View style={styles.successContainer}>
                <CheckCircle2 size={80} color={Colors.success} strokeWidth={1.5} />
                <Text style={styles.successAmount}>₹{transferAmount}</Text>
                <Text style={styles.successText}>Sent to {transferRecipient}</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recipient Name / UPI ID</Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color={Colors.accentBlue} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="achyuth@kairo"
                      placeholderTextColor={Colors.textMuted}
                      value={transferRecipient}
                      onChangeText={setTransferRecipient}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                      value={transferAmount}
                      onChangeText={setTransferAmount}
                    />
                  </View>
                  <Text style={styles.balanceInfo}>
                    Available: {formatCurrency(activeAccount.balance)}
                  </Text>
                </View>

                <View style={styles.swipeWrapper}>
                  <SwipeToPay
                    onSwipeComplete={executeTransfer}
                    label="Slide to Send"
                    disabled={isProcessing}
                  />
                </View>
              </View>
            )}
          </GlassCard>
        </View>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMoneyModalVisible}
        onRequestClose={() => setAddMoneyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="medium" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <Pressable
                onPress={() => setAddMoneyModalVisible(false)}
                hitSlop={15}
                accessibilityRole="button"
                accessibilityLabel="Close add money dialog"
              >
                <X size={24} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deposit Amount</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                  />
                </View>
              </View>

              <View style={styles.depositMethods}>
                <View style={styles.methodItem}>
                  <Wallet size={20} color={Colors.accentCyan} />
                  <Text style={styles.methodText}>UPI / Net Banking</Text>
                </View>
              </View>

              <Pressable 
                style={[styles.confirmButton, isProcessing && styles.disabledButton]}
                onPress={executeAddMoney}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.confirmButtonText}>Deposit Now</Text>
                    <ArrowDownLeft size={18} color="#000" />
                  </>
                )}
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationSettings(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Settings</Text>
            <Pressable
              onPress={() => setShowNotificationSettings(false)}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <X size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <NotificationSettings />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
