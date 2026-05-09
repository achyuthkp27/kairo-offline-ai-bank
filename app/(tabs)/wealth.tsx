/**
 * Kairo — Wealth Screen
 * Premium wealth management interface with portfolio analytics
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, PieChart, Briefcase, Landmark, Coins, ChevronRight } from 'lucide-react-native';

import { Typography, Spacing, Shadows } from '../../src/theme';
import { useHaptics, usePortfolio, useNetWorth } from '../../src/hooks';
import { useThemeColors } from '../../src/hooks/useTheme';
import { GlassCard } from '../../src/components/common/GlassCard';
import { Sparkline } from '../../src/components/charts/Sparkline';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { formatCurrency } from '../../src/utils/formatters';
import { withErrorBoundary } from '../../src/components/common/ErrorBoundary';

const NET_WORTH_HISTORY = [
  3250000, 3310000, 3280000, 3450000, 3520000, 3480000, 3650000, 3810500
];

function WealthScreen() {
  const { trigger } = useHaptics();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const { portfolio } = usePortfolio();
  const { netWorth } = useNetWorth();
  const { Colors, Gradients, isDark } = useThemeColors();

  // Varied mock data for different timeframes to make it feel responsive
  const chartData = useMemo(() => {
    switch (selectedTimeframe) {
      case '1D': return [3805000, 3808000, 3806000, 3812000, 3810000, 3811000, 3810500];
      case '1W': return [3780000, 3795000, 3790000, 3805000, 3815000, 3810000, 3810500];
      case '1M': return [3650000, 3700000, 3750000, 3720000, 3780000, 3820000, 3810500];
      case '3M': return [3450000, 3550000, 3600000, 3580000, 3700000, 3780000, 3810500];
      case '1Y': return NET_WORTH_HISTORY;
      case 'ALL': return [1200000, 1800000, 2400000, 3100000, 3400000, 3650000, 3810500];
      default: return NET_WORTH_HISTORY;
    }
  }, [selectedTimeframe]);

  const PORTFOLIO_COLORS: Record<string, string> = {
    stocks: Colors.accentBlue,
    funds: '#8B5CF6',
    deposits: Colors.success,
    crypto: Colors.accentCyan,
  };

  const PORTFOLIO_ICONS: Record<string, any> = {
    stocks: TrendingUp,
    funds: PieChart,
    deposits: Landmark,
    crypto: Coins,
  };

  const portfolioData = portfolio.map((item) => ({
    label: item.label,
    value: item.value,
    color: PORTFOLIO_COLORS[item.category] || Colors.accentBlue,
    icon: PORTFOLIO_ICONS[item.category] || Briefcase,
  }));

  const totalWealth = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: Colors.successSoft,
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
      backgroundColor: Colors.backgroundTertiary,
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
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#050510', '#0A0A1A', '#0D0D20'] : ['#F5F5F7', '#EBEBED', '#E0E0E5']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wealth</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="medium" style={styles.netWorthCard}>
          <LinearGradient
            colors={[Colors.accentBlue + '20', 'transparent']}
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
              data={chartData} 
              width={280} 
              height={60} 
              color={Colors.success} 
              strokeWidth={3} 
            />
          </View>
          
          <View style={styles.timeframeRow}>
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((time) => (
              <Pressable 
                key={time} 
                onPress={() => {
                  setSelectedTimeframe(time);
                  trigger('selection');
                }}
                style={[styles.timeframeBtn, selectedTimeframe === time && styles.timeframeBtnActive]}
              >
                <Text style={[styles.timeframeText, selectedTimeframe === time && styles.timeframeTextActive]}>
                  {time}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

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

        {activeTab === 'overview' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Allocation</Text>
            <GlassCard variant="light" style={styles.allocationCard}>
              <View style={styles.chartWrapper}>
                <DonutChart 
                  data={portfolioData} 
                  size={180} 
                  strokeWidth={16}
                  centerLabel={`${portfolioData.length} Assets`}
                  centerSublabel="Well diversified"
                />
              </View>

              <View style={styles.legendContainer}>
                {portfolioData.map((item, index) => (
                  <Pressable 
                    key={index} 
                    style={styles.legendItem}
                    onPress={() => trigger('light')}
                  >
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendIconWrapper, { backgroundColor: item.color + '20' }]}>
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
        ) : activeTab === 'assets' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Assets</Text>
            {portfolioData.map((item, index) => (
              <GlassCard key={index} variant="light" style={{ padding: Spacing.lg, marginBottom: Spacing.md }}>
                <View style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendIconWrapper, { backgroundColor: item.color + '20' }]}>
                      <item.icon size={16} color={item.color} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendPercentage}>
                        {((item.value / totalWealth) * 100).toFixed(1)}% of portfolio
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <GlassCard variant="light" style={{ padding: Spacing.xl, alignItems: 'center' as const }}>
              <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>No Liabilities</Text>
              <Text style={styles.legendPercentage}>
                You have no outstanding debts. Excellent financial standing.
              </Text>
            </GlassCard>
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(WealthScreen);
