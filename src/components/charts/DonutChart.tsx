/**
 * Kairo — Donut Chart
 * Premium SVG donut chart with stroke animations for portfolio allocation
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Typography } from '../../theme';

interface DataItem {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DataItem[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  strokeWidth = 20,
  centerLabel,
  centerSublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [animation]);

  let currentOffset = 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {data.map((item, index) => {
            const percentage = item.value / total;
            const strokeDashoffset = circumference - percentage * circumference;
            const offset = currentOffset;
            currentOffset += percentage * circumference;

            const animatedStrokeDashoffset = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, strokeDashoffset],
            });

            return (
              <AnimatedCircle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={animatedStrokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(${(offset / circumference) * 360} ${size / 2} ${size / 2})`}
              />
            );
          })}
        </G>
      </Svg>

      <View style={[styles.centerContent, { width: size, height: size }]}>
        {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        {centerSublabel && <Text style={styles.centerSublabel}>{centerSublabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
  centerSublabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
