/**
 * Kairo — 3D Rotatable Donut Chart
 * Interactive 3D pie chart with gesture rotation
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PieDataItem {
  value: number;
  color: string;
  label: string;
}

interface RotatablePieChartProps {
  data: PieDataItem[];
  size?: number;
  onSegmentSelect?: (item: PieDataItem) => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RotatablePieChart: React.FC<RotatablePieChartProps> = ({
  data,
  size = 220,
  onSegmentSelect,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const rotation = useRef(new Animated.Value(0)).current;
  const [currentRotation, setCurrentRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: currentRotation,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentRotation]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const delta = event.velocityX / 500;
      const newRotation = currentRotation + delta * 360;
      rotation.setValue(newRotation);
    })
    .onEnd((event) => {
      const delta = event.velocityX / 500;
      const newRotation = currentRotation + delta * 360;
      setCurrentRotation(newRotation);
      trigger('light');
    });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const x = event.x - center;
      const y = event.y - center;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const normalizedAngle = (angle + currentRotation + 360) % 360;
      
      let cumulativeAngle = 0;
      for (let i = 0; i < data.length; i++) {
        const percentage = data[i].value / total;
        const segmentAngle = percentage * 360;
        
        if (normalizedAngle >= cumulativeAngle && normalizedAngle < cumulativeAngle + segmentAngle) {
          setSelectedIndex(i);
          trigger('selection');
          onSegmentSelect?.(data[i]);
          break;
        }
        cumulativeAngle += segmentAngle;
      }
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedLabel: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
    },
    selectedValue: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    hint: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: Spacing.md,
    },
    legendContainer: {
      marginTop: Spacing.xl,
      gap: Spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    legendValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textPrimary,
    },
  }), [Colors, data]);

  let currentOffset = 0;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Colors.accentBlue} stopOpacity="1" />
                <Stop offset="100%" stopColor={Colors.accentCyan} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            
            <G rotation={currentRotation} origin={`${center}, ${center}`}>
              {data.map((item, index) => {
                const percentage = item.value / total;
                const strokeDashoffset = circumference - percentage * circumference;
                const offset = currentOffset;
                currentOffset += percentage * circumference;
                const isSelected = selectedIndex === index;
                
                return (
                  <AnimatedCircle
                    key={item.label}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={isSelected ? strokeWidth + 8 : strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(${(offset / circumference) * 360} ${center} ${center})`}
                    opacity={selectedIndex === null || selectedIndex === index ? 1 : 0.5}
                  />
                );
              })}
            </G>
          </Svg>
          
          <View style={[styles.centerContent, { width: size, height: size }]}>
            {selectedIndex !== null ? (
              <>
                <Text style={styles.selectedLabel}>{data[selectedIndex].label}</Text>
                <Text style={styles.selectedValue}>
                  {formatCurrency(data[selectedIndex].value)}
                </Text>
              </>
            ) : (
              <Text style={styles.selectedLabel}>Rotate</Text>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
      
      <Text style={styles.hint}>Drag to rotate • Tap segments</Text>
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
            <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString('en-IN')}`;
};
