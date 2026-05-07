/**
 * Kairo — Weekly Expense Chart
 * Custom smooth curved line chart using React Native SVG
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CHART_HEIGHT = 100;

interface DataPoint {
  day: string;
  value: number;
}

const data: DataPoint[] = [
  { day: 'M', value: 45 },
  { day: 'T', value: 72 },
  { day: 'W', value: 38 },
  { day: 'T', value: 85 },
  { day: 'F', value: 64 },
  { day: 'S', value: 92 },
  { day: 'S', value: 55 },
];

export const WeeklyExpenseChart = () => {
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal;
  
  // Calculate points
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((d.value - minVal) / range) * (CHART_HEIGHT - 20) - 10
  }));

  // Create path using Bezier curves for smoothness
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const fillPath = `${d} V ${CHART_HEIGHT} H ${points[0].x} Z`;

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accentBlue} stopOpacity="0.4" />
            <Stop offset="1" stopColor={Colors.accentBlue} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Fill Area */}
        <Path d={fillPath} fill="url(#gradient)" />
        
        {/* Line */}
        <Path
          d={d}
          fill="none"
          stroke={Colors.accentBlue}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
