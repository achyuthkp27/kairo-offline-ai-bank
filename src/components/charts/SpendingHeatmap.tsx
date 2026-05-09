/**
 * Kairo — Spending Heatmap
 * Calendar view showing spending intensity throughout the month
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeatmapDay {
  date: Date;
  amount: number;
  label?: string;
}

interface SpendingHeatmapProps {
  month: number;
  year: number;
  data?: HeatmapDay[];
  onDayPress?: (day: HeatmapDay) => void;
}

const getHeatColor = (amount: number, maxAmount: number, Colors: any) => {
  if (amount === 0) return Colors.backgroundTertiary;
  const intensity = Math.min(amount / maxAmount, 1);
  
  if (intensity > 0.75) return '#EF4444';
  if (intensity > 0.5) return '#F59E0B';
  if (intensity > 0.25) return Colors.accentCyan;
  return Colors.success + '60';
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  month,
  year,
  data = [],
  onDayPress,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();

  const generateCalendarData = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const calendar: (HeatmapDay | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      calendar.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const existingData = data.find(d => 
        d.date.getDate() === day && 
        d.date.getMonth() === month && 
        d.date.getFullYear() === year
      );
      calendar.push({
        date,
        amount: existingData?.amount || Math.random() * 15000,
        label: WEEKDAYS[date.getDay()],
      });
    }
    
    return calendar;
  };

  const calendarData = useMemo(() => generateCalendarData(), [month, year, data]);
  const maxAmount = Math.max(...calendarData.filter(d => d).map(d => d!.amount), 1);
  const today = new Date();
  
  const stats = useMemo(() => {
    const daysWithSpending = calendarData.filter(d => d && d.amount > 0);
    const totalSpending = daysWithSpending.reduce((sum, d) => sum + (d?.amount || 0), 0);
    const avgDaily = daysWithSpending.length > 0 ? totalSpending / daysWithSpending.length : 0;
    const maxDay = daysWithSpending.reduce((max, d) => 
      (d?.amount || 0) > (max?.amount || 0) ? d : max, daysWithSpending[0]);
    
    return { totalSpending, avgDaily, maxDay };
  }, [calendarData]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: Spacing.base,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    monthTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    subtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
    },
    weekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.sm,
    },
    weekdayText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 11,
      color: Colors.textMuted,
      width: (SCREEN_WIDTH - Spacing.base * 4) / 7,
      textAlign: 'center',
    },
    weeksContainer: {
      gap: 6,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    dayCell: {
      width: (SCREEN_WIDTH - Spacing.base * 4) / 7,
      height: (SCREEN_WIDTH - Spacing.base * 4) / 7,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 11,
      color: Colors.textSecondary,
    },
    dayAmount: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: 8,
      color: '#fff',
      marginTop: 2,
    },
    emptyCell: {
      width: (SCREEN_WIDTH - Spacing.base * 4) / 7,
      height: (SCREEN_WIDTH - Spacing.base * 4) / 7,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
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
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    legendLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
    },
    legendScale: {
      flexDirection: 'row',
      gap: 4,
    },
    legendBlock: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
  }), [Colors]);

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.monthTitle}>{MONTHS[month]}</Text>
          <Text style={styles.subtitle}>{year}</Text>
        </View>
      </View>
      
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.weeksContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={dayIndex} style={styles.emptyCell} />;
              }
              
              const isToday = 
                day.date.getDate() === today.getDate() &&
                day.date.getMonth() === today.getMonth() &&
                day.date.getFullYear() === today.getFullYear();
              const heatColor = getHeatColor(day.amount, maxAmount, Colors);
              
              return (
                <Pressable
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    { backgroundColor: heatColor },
                    isToday && { borderWidth: 2, borderColor: Colors.accentBlue },
                  ]}
                  onPress={() => {
                    trigger('light');
                    onDayPress?.(day);
                  }}
                >
                  <Text style={styles.dayText}>{day.date.getDate()}</Text>
                  {day.amount > 0 && (
                    <Text style={styles.dayAmount}>
                      {formatCompactCurrency(day.amount)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{formatCompactCurrency(stats.totalSpending)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{formatCompactCurrency(stats.avgDaily)}</Text>
          <Text style={styles.statLabel}>Daily Avg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{formatCompactCurrency(stats.maxDay?.amount || 0)}</Text>
          <Text style={styles.statLabel}>Highest Day</Text>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
        <Text style={styles.legendLabel}>Less</Text>
        <View style={styles.legendScale}>
          <View style={[styles.legendBlock, { backgroundColor: Colors.backgroundTertiary }]} />
          <View style={[styles.legendBlock, { backgroundColor: Colors.success + '60' }]} />
          <View style={[styles.legendBlock, { backgroundColor: Colors.accentCyan }]} />
          <View style={[styles.legendBlock, { backgroundColor: '#F59E0B' }]} />
          <View style={[styles.legendBlock, { backgroundColor: '#EF4444' }]} />
        </View>
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};
