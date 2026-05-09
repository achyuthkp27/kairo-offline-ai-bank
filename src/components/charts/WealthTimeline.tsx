/**
 * Kairo — Wealth Timeline Chart
 * Animated growth projection chart with interactive timeline
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CHART_HEIGHT = 180;
const PADDING_BOTTOM = 30;

interface TimelinePoint {
  month: string;
  actual?: number;
  projected?: number;
}

interface WealthTimelineProps {
  data: TimelinePoint[];
  currentMonth: number;
  onPointSelect?: (point: TimelinePoint) => void;
}

export const WealthTimeline: React.FC<WealthTimelineProps> = ({
  data,
  currentMonth,
  onPointSelect,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const maxValue = Math.max(...data.map(d => Math.max(d.actual || 0, d.projected || 0)));
  const minValue = Math.min(...data.map(d => Math.min(d.actual || 0, d.projected || 0)));
  const range = maxValue - minValue || 1;
  
  const pointSpacing = CHART_WIDTH / (data.length - 1);

  const getY = (value: number) => {
    return CHART_HEIGHT - PADDING_BOTTOM - ((value - minValue) / range) * (CHART_HEIGHT - PADDING_BOTTOM - 20);
  };

  const actualPoints = data
    .map((d, i) => d.actual !== undefined ? { x: i * pointSpacing, y: getY(d.actual), value: d.actual } : null)
    .filter(Boolean) as { x: number; y: number; value: number }[];
  
  const projectedPoints = data
    .map((d, i) => d.projected !== undefined ? { x: i * pointSpacing, y: getY(d.projected), value: d.projected } : null)
    .filter(Boolean) as { x: number; y: number; value: number }[];

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp2x = p0.x + (p1.x - p0.x) * 2 / 3;
      path += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    
    return path;
  };

  const actualPath = createSmoothPath(actualPoints);
  const projectedPath = createSmoothPath(projectedPoints);
  const fillPath = `${actualPath} V ${CHART_HEIGHT - PADDING_BOTTOM} H ${actualPoints[0].x} Z`;

  const lastActualPoint = actualPoints[actualPoints.length - 1];
  const lastProjectedPoint = projectedPoints[projectedPoints.length - 1];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: Spacing.base,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.xl,
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    subtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
      marginTop: 2,
    },
    legendContainer: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 11,
      color: Colors.textMuted,
    },
    chartContainer: {
      alignItems: 'center',
    },
    tooltipContainer: {
      position: 'absolute',
      top: -60,
      alignItems: 'center',
      backgroundColor: Colors.cardSurface,
      padding: Spacing.sm,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      minWidth: 100,
    },
    tooltipValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
    },
    tooltipLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
    },
    projectionBadge: {
      position: 'absolute',
      top: -30,
      left: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.accentBlue + '30',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    projectionText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.accentBlue,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.xl,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border + '30',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
    },
    statLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: 2,
    },
    statChange: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 10,
    },
    monthLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
    },
    monthLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
    },
  }), [Colors]);

  const growthRate = lastProjectedPoint && lastActualPoint
    ? ((lastProjectedPoint.value - lastActualPoint.value) / lastActualPoint.value) * 100
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wealth Projection</Text>
          <Text style={styles.subtitle}>Actual vs Predicted Growth</Text>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accentCyan }]} />
            <Text style={styles.legendText}>Actual</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accentBlue, opacity: 0.5 }]} />
            <Text style={styles.legendText}>Projected</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.projectionBadge}>
          <Text style={styles.projectionText}>+{growthRate.toFixed(1)}% Projected</Text>
        </View>
        
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.accentCyan} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={Colors.accentCyan} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1={0}
              y1={getY(minValue + range * ratio)}
              x2={CHART_WIDTH}
              y2={getY(minValue + range * ratio)}
              stroke={Colors.border + '20'}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}
          
          {/* Fill area */}
          <Path
            d={fillPath}
            fill="url(#actualGradient)"
          />
          
          {/* Actual line */}
          <Path
            d={actualPath}
            stroke={Colors.accentCyan}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Projected line */}
          <Path
            d={projectedPath}
            stroke={Colors.accentBlue}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity={0.7}
          />
          
          {/* Current point indicator */}
          {lastActualPoint && (
            <Circle
              cx={lastActualPoint.x}
              cy={lastActualPoint.y}
              r={6}
              fill={Colors.accentCyan}
              stroke={Colors.background}
              strokeWidth={2}
            />
          )}
        </Svg>
        
        <View style={styles.monthLabels}>
          {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, i) => (
            <Text key={i} style={styles.monthLabel}>{d.month}</Text>
          ))}
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{(lastActualPoint?.value / 100000).toFixed(2)}L</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.success }]}>+{(growthRate).toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Growth Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{(lastProjectedPoint?.value / 100000).toFixed(2)}L</Text>
          <Text style={styles.statLabel}>Projected</Text>
        </View>
      </View>
    </View>
  );
};

export const MOCK_TIMELINE_DATA: TimelinePoint[] = [
  { month: 'Jul', actual: 3200000 },
  { month: 'Aug', actual: 3350000 },
  { month: 'Sep', actual: 3280000 },
  { month: 'Oct', actual: 3450000 },
  { month: 'Nov', actual: 3520000 },
  { month: 'Dec', actual: 3480000 },
  { month: 'Jan', actual: 3650000, projected: 3650000 },
  { month: 'Feb', projected: 3780000 },
  { month: 'Mar', projected: 3820000 },
  { month: 'Apr', projected: 3950000 },
  { month: 'May', projected: 4100000 },
  { month: 'Jun', projected: 4250000 },
];
