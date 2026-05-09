/**
 * Kairo — Asset Allocation Donut Chart
 * Interactive chart with swipe-to-browse and tap selection
 */

import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing } from '../../theme';

export interface AssetDataItem {
  value: number;
  color: string;
  label: string;
  description?: string;
  change?: number;
  icon?: React.ComponentType<any>;
}

interface AssetAllocationChartProps {
  data: AssetDataItem[];
  size?: number;
  onAssetSelect?: (item: AssetDataItem) => void;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  size = 220,
  onAssetSelect,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const offsetX = useSharedValue(0);
  const startOffsetX = useSharedValue(0);

  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const triggerHaptics = useCallback((type: 'light' | 'selection') => {
    trigger(type);
  }, [trigger]);

  const handleAssetSelect = useCallback((index: number) => {
    setActiveIndex(index);
    trigger('selection');
    onAssetSelect?.(data[index]);
  }, [trigger, onAssetSelect, data]);

  const handleSwipe = useCallback((direction: number) => {
    const current = activeIndex ?? -1;
    let next: number;
    if (direction > 0) {
      next = current <= 0 ? data.length - 1 : current - 1;
    } else {
      next = current >= data.length - 1 ? 0 : current + 1;
    }
    setActiveIndex(next);
    trigger('selection');
    onAssetSelect?.(data[next]);
  }, [activeIndex, data, trigger, onAssetSelect]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startOffsetX.value = offsetX.value;
    })
    .onUpdate((event) => {
      offsetX.value = startOffsetX.value + event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 50) {
        runOnJS(handleSwipe)(event.translationX);
      }
      offsetX.value = withSpring(0, { damping: 20, stiffness: 200 });
      runOnJS(triggerHaptics)('light');
    });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const x = event.x - center;
      const y = event.y - center;
      const dist = Math.sqrt(x * x + y * y);
      
      if (dist < radius - strokeWidth / 2 || dist > radius + strokeWidth / 2) {
        return;
      }

      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const normalizedAngle = (angle + 360 + 90) % 360;
      
      let cumulativeAngle = 0;
      for (let i = 0; i < data.length; i++) {
        const percentage = data[i].value / total;
        const segmentAngle = percentage * 360;
        
        if (normalizedAngle >= cumulativeAngle && normalizedAngle < cumulativeAngle + segmentAngle) {
          runOnJS(handleAssetSelect)(i);
          return;
        }
        cumulativeAngle += segmentAngle;
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offsetX.value * 0.3 }],
    };
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      width: size - 60,
      height: size - 60,
    },
    assetPercentage: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
      textAlign: 'center',
    },
    assetValue: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    assetLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 9,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    placeholderLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
      textAlign: 'center',
    },
    hint: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    legendContainer: {
      marginTop: Spacing.md,
      width: '100%',
      gap: Spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.xs,
      width: '100%',
      minHeight: 46,
    },
    legendLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.md,
      flex: 1,
      minWidth: 0,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: Spacing.sm,
    },
    legendText: {
      flexShrink: 1,
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textSecondary,
      minWidth: 0,
    },
    legendValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginLeft: Spacing.sm,
      minWidth: 100,
    },
    legendValue: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      marginRight: Spacing.xs,
    },
    legendAmount: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textMuted,
    },
  }), [Colors, data, size]);

  const currentAsset = activeIndex !== null ? data[activeIndex] : null;
  const percentage = currentAsset ? Math.round((currentAsset.value / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.chartWrapper}>
          <Animated.View style={animatedStyle}>
            <Svg width={size} height={size}>
              <Defs>
                <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={Colors.accentBlue} stopOpacity="1" />
                  <Stop offset="100%" stopColor={Colors.accentCyan} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              
              <G>
                {data.map((item, index) => {
                  const pct = item.value / total;
                  const strokeDashoffset = circumference - pct * circumference;
                  const segmentStartAngle = (data.slice(0, index).reduce((sum, d) => sum + (d.value / total), 0)) * 360;
                  const isActive = activeIndex === index;
                  
                  return (
                    <Circle
                      key={item.label}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={item.color}
                      strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                      fill="transparent"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform={`rotate(${segmentStartAngle} ${center} ${center})`}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                    />
                  );
                })}
              </G>
            </Svg>
          </Animated.View>
          
          <View style={styles.centerContent}>
            {currentAsset ? (
              <>
                <Text style={styles.assetPercentage}>{percentage}%</Text>
                <Text style={styles.assetValue}>{formatCompactCurrency(currentAsset.value)}</Text>
                <Text style={styles.assetLabel}>{currentAsset.label}</Text>
              </>
            ) : (
              <Text style={styles.placeholderLabel}>Swipe to{'\n'}browse</Text>
            )}
          </View>
        </View>
      </GestureDetector>
      
      <Text style={styles.hint}>Tap segment or swipe left/right</Text>
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <View 
              key={index} 
              style={[
                styles.legendItem,
                activeIndex === index && { backgroundColor: Colors.cardSurface, borderRadius: 8 }
              ]}
            >
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
              <View style={styles.legendValueContainer}>
                <Text style={styles.legendValue}>{pct}%</Text>
                <Text style={styles.legendAmount}>
                  {formatCurrency(item.value)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString('en-IN')}`;
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

export default AssetAllocationChart;