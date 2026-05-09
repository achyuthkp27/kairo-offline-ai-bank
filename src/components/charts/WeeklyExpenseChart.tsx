import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Spacing, Typography } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (Spacing.base + Spacing.xl) * 2;
const CHART_HEIGHT = 120;

export interface DataPoint {
  day: string;
  value: number;
}

interface WeeklyExpenseChartProps {
  data?: DataPoint[];
}

const DEFAULT_DATA: DataPoint[] = [
  { day: 'M', value: 0 },
  { day: 'T', value: 0 },
  { day: 'W', value: 0 },
  { day: 'T', value: 0 },
  { day: 'F', value: 0 },
  { day: 'S', value: 0 },
  { day: 'S', value: 0 },
];

export const WeeklyExpenseChart: React.FC<WeeklyExpenseChartProps> = ({ data }) => {
  const { Colors } = useThemeColors();
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;
  const hasData = chartData.some(d => d.value > 0);
  
  const maxVal = Math.max(...chartData.map(d => d.value), 100);
  const minVal = 0; // Always start from 0 for expense charts
  const range = maxVal - minVal;

  const points = chartData.map((d, i) => ({
    x: (i / (chartData.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((d.value - minVal) / range) * (CHART_HEIGHT - 40) - 20
  }));

  // Create smooth cubic bezier path
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const fillPath = `${d} V ${CHART_HEIGHT} H ${points[0].x} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.accentBlue} stopOpacity="0.3" />
              <Stop offset="1" stopColor={Colors.accentBlue} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Fill Area */}
          <Path d={fillPath} fill="url(#fillGradient)" />
          
          {/* Main Line */}
          <Path
            d={d}
            fill="none"
            stroke={Colors.accentBlue}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Indicator Dot for last point */}
          {hasData && (
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="4"
              fill={Colors.accentBlue}
            />
          )}
        </Svg>
      </View>
      
      {/* X-Axis Labels */}
      <View style={styles.labelsContainer}>
        {chartData.map((d, i) => (
          <Text 
            key={i} 
            style={[styles.label, { color: Colors.textMuted }]}
          >
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    width: '100%',
  },
  svgWrapper: {
    height: CHART_HEIGHT,
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginTop: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    width: 20,
    textAlign: 'center',
  },
});