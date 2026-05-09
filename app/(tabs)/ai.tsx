import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, Brain, Sparkles } from 'lucide-react-native';

import { Typography, Spacing } from '../../src/theme';
import { useThemeColors } from '../../src/hooks/useTheme';
import { SubscriptionService, Subscription } from '../../src/services/SubscriptionService';
import { MemoryManager } from '../../src/components/ai/MemoryManager';
import { SubscriptionCard } from '../../src/components/ai/SubscriptionCard';
import { formatCurrency } from '../../src/utils/formatters';
import { withErrorBoundary } from '../../src/components/common/ErrorBoundary';

function AIScreen() {
  const { Colors, isDark } = useThemeColors();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'memory'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      SubscriptionService.detectSubscriptions().then(subs => {
        setSubscriptions(subs);
        const total = subs.reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12), 0);
        setTotalMonthly(total);
      });
    }
  }, [activeTab]);

  const gradientColors: [string, string, string] = isDark
    ? ['#0A0A0A', '#111111', '#0A0A0A']
    : ['#F5F5F7', '#EBEBED', '#E0E0E5'];

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
      marginBottom: Spacing.lg,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: Colors.cardSurface,
      borderRadius: 16,
      padding: 4,
      marginBottom: Spacing.xl,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    activeTab: {
      backgroundColor: Colors.cardSurfaceHover,
    },
    tabLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 14,
      color: Colors.textMuted,
    },
    activeTabLabel: {
      color: Colors.textPrimary,
    },
    scrollContent: { paddingBottom: 100 },
    summaryCard: {
      backgroundColor: Colors.accentBlueSoft,
      borderRadius: 24,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.accentBlueGlow,
    },
    summaryLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 12,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    summaryValue: {
      fontFamily: Typography.fontFamily.black,
      fontSize: 32,
      color: Colors.textPrimary,
      marginBottom: 12,
    },
    summaryFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summarySub: { fontFamily: Typography.fontFamily.regular, fontSize: 12, color: Colors.textSecondary },
    sectionTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: 16,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    emptyState: { padding: Spacing.xl, alignItems: 'center' },
    emptyText: { fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Financial Intelligence</Text>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <Pressable 
            style={[styles.tab, activeTab === 'subscriptions' && styles.activeTab]}
            onPress={() => setActiveTab('subscriptions')}
          >
            <RefreshCw size={18} color={activeTab === 'subscriptions' ? Colors.accentCyan : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'subscriptions' && styles.activeTabLabel]}>Subscriptions</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.tab, activeTab === 'memory' && styles.activeTab]}
            onPress={() => setActiveTab('memory')}
          >
            <Brain size={18} color={activeTab === 'memory' ? Colors.accentCyan : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'memory' && styles.activeTabLabel]}>Memory</Text>
          </Pressable>
        </View>

        {activeTab === 'subscriptions' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Monthly Burn Rate</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalMonthly)}</Text>
              <View style={styles.summaryFooter}>
                <Sparkles size={12} color={Colors.accentCyan} />
                <Text style={styles.summarySub}>Kairo identified {subscriptions.length} recurring payments</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            {subscriptions.map(sub => (
              <SubscriptionCard 
                key={sub.id} 
                subscription={sub} 
                onSimulateCancel={(s) => console.log('Cancel', s.merchantName)} 
              />
            ))}
            
            {subscriptions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recurring patterns detected yet.</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <MemoryManager />
        )}
      </View>
    </SafeAreaView>
  );
}

export default withErrorBoundary(AIScreen);
