/**
 * Kairo — Wealth Screen
 * Premium wealth management interface with portfolio analytics
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, PieChart, Briefcase, Landmark, Coins, ChevronRight } from 'lucide-react-native';

import { Colors, Typography, Spacing, Shadows } from '../../src/theme';
import { useHaptics } from '../../src/hooks';
import { GlassCard } from '../../src/components/common/GlassCard';
import { Sparkline } from '../../src/components/charts/Sparkline';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { formatCurrency } from '../../src/utils/formatters';

const NET_WORTH_HISTORY = [
  3250000, 3310000, 3280000, 3450000, 3520000, 3480000, 3650000, 3810500
];

const PORTFOLIO_DATA = [
  { label: 'Indian Equities', value: 2150000, color: Colors.accentBlue, icon: TrendingUp },
  { label: 'Mutual Funds', value: 850000, color: '#8B5CF6', icon: PieChart },
  { label: 'Fixed Deposits', value: 450000, color: Colors.success, icon: Landmark },
  { label: 'Crypto', value: 360500, color: Colors.accentCyan, icon: Coins },
];

export default function WealthScreen() {
  const { trigger } = useHaptics();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities'>('overview');

  const totalWealth = PORTFOLIO_DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#050510', '#0A0A1A', '#0D0D20']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wealth</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Net Worth Card */}
        <GlassCard variant="medium" style={styles.netWorthCard}>
          <LinearGradient
            colors={['rgba(46, 91, 255, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.netWorthHeader}>
            <View>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthValue}>{formatCurrency(totalWealth)}</Text>
            </View>
            <View style={styles.returnBadge}>
              <TrendingUp size={14} color={Colors.success} strokeWidth={2} />
              <Text style={styles.returnText}>+12.4%</Text>
            </View>
          </View>

          <View style={styles.sparklineContainer}>
            <Sparkline 
              data={NET_WORTH_HISTORY} 
              width={280} 
              height={60} 
              color={Colors.success} 
              strokeWidth={3} 
            />
          </View>
          
          <View style={styles.timeframeRow}>
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((time, i) => (
              <Pressable 
                key={time} 
                onPress={() => trigger('light')}
                style={[styles.timeframeBtn, i === 4 && styles.timeframeBtnActive]}
              >
                <Text style={[styles.timeframeText, i === 4 && styles.timeframeTextActive]}>
                  {time}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['overview', 'assets', 'liabilities'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                trigger('selection');
              }}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Portfolio Allocation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <GlassCard variant="light" style={styles.allocationCard}>
            <View style={styles.chartWrapper}>
              <DonutChart 
                data={PORTFOLIO_DATA} 
                size={180} 
                strokeWidth={16}
                centerLabel="4 Assets"
                centerSublabel="Well diversified"
              />
            </View>

            <View style={styles.legendContainer}>
              {PORTFOLIO_DATA.map((item, index) => (
                <Pressable 
                  key={index} 
                  style={styles.legendItem}
                  onPress={() => trigger('light')}
                >
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendIconWrapper, { backgroundColor: `${item.color}20` }]}>
                      <item.icon size={16} color={item.color} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendPercentage}>
                        {((item.value / totalWealth) * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </View>
                </Pressable>
              ))}
            </View>
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
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 100,
  },
  netWorthCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  netWorthLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  netWorthValue: {
    fontFamily: Typography.fontFamily.black,
    fontSize: Typography.fontSize['3xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 153, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
  },
  returnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    marginLeft: 4,
  },
  sparklineContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  timeframeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeframeBtnActive: {
    backgroundColor: Colors.cardSurfaceHover,
  },
  timeframeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  timeframeTextActive: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    marginRight: Spacing.xl,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: Colors.accentBlue,
  },
  tabText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.bold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  allocationCard: {
    padding: Spacing.xl,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.md,
  },
  legendContainer: {
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  legendLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  legendPercentage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  footerSpacer: {
    height: 60,
  },
});
