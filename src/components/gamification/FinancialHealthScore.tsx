/**
 * Kairo — Financial Health Score
 * Premium circular gauge showing overall financial health (0-100)
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { GlassCard } from '../common/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FinancialHealthScoreProps {
  score: number;
  size?: number;
}

interface HealthMetric {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'alert';
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  score,
  size = 140,
}) => {
  const { Colors } = useThemeColors();
  const animatedScore = useRef(new Animated.Value(0)).current;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  useEffect(() => {
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return Colors.success;
    if (s >= 60) return Colors.accentCyan;
    if (s >= 40) return Colors.warning;
    return Colors.error;
  };

  const [displayScore, setDisplayScore] = useState(0);
  const scoreColor = getScoreColor(displayScore);

  useEffect(() => {
    const listener = animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    return () => animatedScore.removeListener(listener);
  }, []);

  const strokeDashoffset = circumference - (score / 100) * circumference;

  const metrics: HealthMetric[] = [
    { label: 'Savings Rate', value: '32%', status: 'good' },
    { label: 'Credit Utilization', value: '28%', status: 'good' },
    { label: 'Monthly Cashflow', value: '+₹45K', status: 'good' },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    lastUpdated: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
    },
    gaugeContainer: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    scoreLabel: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: size * 0.28,
      color: scoreColor,
    },
    scoreSubtext: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 4,
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    metricItem: {
      alignItems: 'center',
    },
    metricValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
    },
    metricGood: {
      color: Colors.success,
    },
    metricWarning: {
      color: Colors.warning,
    },
    metricAlert: {
      color: Colors.error,
    },
    metricLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: 2,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
      gap: 4,
    },
    footerText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
    },
    footerBadge: {
      backgroundColor: Colors.success + '15',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    footerBadgeText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 9,
      color: Colors.success,
    },
    centerContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [Colors, size, scoreColor]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Health</Text>
        <Text style={styles.lastUpdated}>Updated today</Text>
      </View>
      
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={scoreColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={scoreColor} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.backgroundTertiary}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text style={styles.scoreLabel}>{displayScore}</Text>
          <Text style={styles.scoreSubtext}>of 100</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricItem}>
            <Text style={[
              styles.metricValue,
              metric.status === 'good' && styles.metricGood,
              metric.status === 'warning' && styles.metricWarning,
              metric.status === 'alert' && styles.metricAlert,
            ]}>
              {metric.value}
            </Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Text style={styles.footerBadgeText}>Excellent</Text>
        </View>
        <Text style={styles.footerText}>Keep maintaining your financial health</Text>
      </View>
    </View>
  );
};
