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
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
import { CheckCircle2, X, Wallet, User, ArrowDownLeft } from 'lucide-react-native';

import { Colors, Typography, Spacing, Shadows, Gradients } from '../../src/theme';
import { BorderRadius } from '../../src/theme';
import { useAccountStore, useUIStore, useNotificationStore, useAuthStore } from '../../src/store';
import { useHaptics, useTransactions, useCategorySpending, useNetWorth } from '../../src/hooks';
import { DashboardHeader } from '../../src/components/layout/DashboardHeader';
import { AccountCarousel } from '../../src/components/cards/AccountCarousel';
import { AccountDetailWidget } from '../../src/components/layout/AccountDetailWidget';
import { GlassCard } from '../../src/components/common/GlassCard';
import { TransactionItem } from '../../src/components/common/TransactionItem';
import { WeeklyExpenseChart } from '../../src/components/charts/WeeklyExpenseChart';
import { formatCurrency } from '../../src/utils/formatters';
import { InsightEngine, AIInsight } from '../../src/services/InsightEngine';
import { DynamicInsightCard } from '../../src/components/ai/DynamicInsightCard';
import { TransferService } from '../../src/services/TransferService';

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
  const { refresh: refreshNetWorth } = useNetWorth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  
  // Real-time Transaction State
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  // Scanner State
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scannerVisible) return;
    setScannerVisible(false);
    trigger('success');
    
    // Simulate extracting merchant name from UPI URL or ID
    const merchantName = data.includes('pa=') 
      ? data.split('pn=')[1]?.split('&')[0]?.replace(/%20/g, ' ') || 'UPI Merchant'
      : data;
      
    setTransferRecipient(merchantName);
    setTransferAmount('');
    setTransferModalVisible(true);
  };

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
      case 'upi':
        setTransferRecipient('');
        setTransferAmount('');
        setTransferModalVisible(true);
        break;
      case 'add':
        setTransferAmount('');
        setAddMoneyModalVisible(true);
        break;
      case 'scan':
        if (!permission?.granted) {
          requestPermission();
        } else {
          setScannerVisible(true);
        }
        break;
      case 'pay':
        Alert.alert(
          'Pay Bills', 
          'Select a bill to pay in real-time:',
          [
            { text: 'Tata Power (₹2,450)', onPress: () => {
              setTransferRecipient('Tata Power');
              setTransferAmount('2450');
              setTransferModalVisible(true);
            }},
            { text: 'Airtel (₹999)', onPress: () => {
              setTransferRecipient('Airtel Fiber');
              setTransferAmount('999');
              setTransferModalVisible(true);
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        break;
      case 'fd':
        Alert.alert(
          'Fixed Deposits', 
          `Current FD: ${accountDetails.fdMaturityStatus}\n\nTop Rates:\n• 1 Year: 7.20% p.a.\n• 3 Years: 7.50% p.a.`,
          [{ text: 'Book New FD', style: 'default' }, { text: 'Close', style: 'cancel' }]
        );
        break;
      case 'invest':
        router.push('/wealth');
        break;
      case 'analytics':
        router.push('/ai');
        break;
      default:
        console.log('Action pressed:', actionId);
    }
  };

  const executeTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || !transferRecipient) {
      Alert.alert('Error', 'Please enter a valid amount and recipient');
      return;
    }

    setIsProcessing(true);
    try {
      await TransferService.performTransfer(amount, transferRecipient);
      trigger('success');
      setTransferSuccess(true);
      setTimeout(() => {
        setTransferModalVisible(false);
        setTransferSuccess(false);
        setTransferAmount('');
        setTransferRecipient('');
        refreshTxns();
        refreshSpending();
        refreshNetWorth();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Transfer Failed', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAddMoney = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await TransferService.addFunds(amount);
      trigger('success');
      setAddMoneyModalVisible(false);
      setTransferAmount('');
      refreshTxns();
      refreshSpending();
      refreshNetWorth();
      Alert.alert('Success', `₹${amount} added successfully!`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsProcessing(false);
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
              <Pressable onPress={() => setScannerVisible(false)} style={styles.scannerCloseButton}>
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
              <Pressable onPress={() => setTransferModalVisible(false)} hitSlop={15}>
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

                <Pressable 
                  style={[styles.confirmButton, isProcessing && styles.disabledButton]}
                  onPress={executeTransfer}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.confirmButtonText}>Send Money</Text>
                      <ArrowUpRight size={18} color="#000" />
                    </>
                  )}
                </Pressable>
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
              <Pressable onPress={() => setAddMoneyModalVisible(false)} hitSlop={15}>
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
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  modalBody: {
    gap: Spacing.xl,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#000',
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  
  // Scanner Styles
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
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
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
    color: '#000',
  },
});
