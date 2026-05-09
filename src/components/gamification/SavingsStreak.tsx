/**
 * Kairo — Savings Streak Tracker
 * Premium banking-style streak tracker
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Flame, TrendingUp, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { GlassCard } from '../common/GlassCard';

interface SavingsStreakProps {
  currentStreak: number;
  bestStreak: number;
  onPress?: () => void;
}

export const SavingsStreak: React.FC<SavingsStreakProps> = ({
  currentStreak,
  bestStreak,
  onPress,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  const flameAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentStreak > 0) {
      const animate = () => {
        Animated.sequence([
          Animated.timing(flameAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (currentStreak > 0) {
            animate();
          }
        });
      };
      animate();
    }
  }, [currentStreak, flameAnim]);

  const isNewRecord = currentStreak >= bestStreak && currentStreak > 0;

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
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.gold + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    bestRecord: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bestRecordIcon: {
      width: 16,
      height: 16,
    },
    bestRecordText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 12,
      color: Colors.gold,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    streakInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    flameWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.gold + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakNumber: {
      fontFamily: Typography.fontFamily.black,
      fontSize: 40,
      color: Colors.textPrimary,
    },
    streakLabel: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    statsGroup: {
      alignItems: 'flex-end',
    },
    statValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
    },
    statLabel: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: Spacing.lg,
    },
    weekSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    weekLabel: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    weekContainer: {
      flexDirection: 'row',
      gap: 6,
    },
    dayDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 11,
      color: Colors.textPrimary,
    },
  }), [Colors]);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = new Date().getDay();
  const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <Pressable
      onPress={() => {
        trigger('light');
        onPress?.();
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <View style={styles.iconWrapper}>
              <TrendingUp size={18} color={Colors.gold} />
            </View>
            <Text style={styles.title}>Savings Streak</Text>
          </View>
          {isNewRecord && (
            <View style={styles.bestRecord}>
              <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
                <Flame size={16} color={Colors.gold} fill={Colors.gold} />
              </Animated.View>
              <Text style={styles.bestRecordText}>New Record!</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.streakInfo}>
            <View style={styles.flameWrapper}>
              <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
                <Flame size={32} color={Colors.gold} fill={Colors.gold} />
              </Animated.View>
            </View>
            <View>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
          
          <View style={styles.statsGroup}>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best Record</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.weekSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color={Colors.textMuted} />
            <Text style={styles.weekLabel}>This Week</Text>
          </View>
          <View style={styles.weekContainer}>
            {days.map((day, index) => {
              const isCompleted = index < adjustedIndex || index === adjustedIndex;
              const isToday = index === adjustedIndex;
              return (
                <View
                  key={index}
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: isCompleted ? Colors.gold : Colors.backgroundTertiary,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: isToday ? Colors.gold : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
