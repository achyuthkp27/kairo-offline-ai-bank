/**
 * Kairo — Achievement Badges
 * Premium banking-style achievement system with sophisticated design
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  TrendingUp, 
  Shield, 
  Zap, 
  Award, 
  Star,
  Target,
  Rocket,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react-native';
import { useThemeColors, useHaptics } from '../../hooks';
import { Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { GlassCard } from '../common/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

interface AchievementBadgesProps {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
}

const ICON_MAP: Record<string, any> = {
  trophy: Trophy,
  trending: TrendingUp,
  shield: Shield,
  zap: Zap,
  award: Award,
  star: Star,
  target: Target,
  rocket: Rocket,
  sparkles: Sparkles,
};

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements,
  onAchievementPress,
}) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: 0,
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
    progressGroup: {
      alignItems: 'flex-end',
    },
    progressText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.gold,
    },
    progressSubtext: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textMuted,
    },
    completionBar: {
      height: 4,
      backgroundColor: Colors.backgroundTertiary,
      borderRadius: 2,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    completionFill: {
      height: '100%',
      backgroundColor: Colors.gold,
      borderRadius: 2,
    },
    listContainer: {
      gap: Spacing.sm,
    },
    badgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: Colors.cardSurface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    badgeCardUnlocked: {
      borderColor: Colors.gold + '30',
    },
    badgeIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    badgeContent: {
      flex: 1,
    },
    badgeTitle: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    badgeTitleLocked: {
      color: Colors.textMuted,
    },
    badgeDescription: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    badgeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.sm,
    },
    badgeDate: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
    },
    progressBar: {
      flex: 1,
      height: 3,
      backgroundColor: Colors.backgroundTertiary,
      borderRadius: 2,
      overflow: 'hidden',
      maxWidth: 100,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
      marginLeft: 'auto',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.success + '15',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    statusText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 10,
      color: Colors.success,
    },
    lockedBadge: {
      backgroundColor: Colors.backgroundTertiary,
    },
    lockedText: {
      color: Colors.textMuted,
    },
  }), [Colors]);

  const getIconColor = (unlocked: boolean) => {
    return unlocked ? '#fff' : Colors.textMuted;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.iconWrapper}>
            <Trophy size={20} color={Colors.gold} />
          </View>
          <Text style={styles.title}>Milestones</Text>
        </View>
        <View style={styles.progressGroup}>
          <Text style={styles.progressText}>{unlockedCount}/{totalCount}</Text>
          <Text style={styles.progressSubtext}>{completionRate}% Complete</Text>
        </View>
      </View>

      <View style={styles.completionBar}>
        <View style={[styles.completionFill, { width: `${completionRate}%` }]} />
      </View>
      
      <View style={styles.listContainer}>
        {achievements.slice(0, 5).map((achievement) => {
          const IconComponent = ICON_MAP[achievement.icon] || Star;
          const progressPercent = achievement.progress !== undefined && achievement.target
            ? (achievement.progress / achievement.target) * 100
            : achievement.unlocked ? 100 : 0;

          const gradientColors = achievement.unlocked
            ? [Colors.gold + '30', Colors.gold + '15']
            : ['transparent', 'transparent'];

          return (
            <Pressable
              key={achievement.id}
              onPress={() => {
                trigger('light');
                onAchievementPress?.(achievement);
              }}
            >
              <LinearGradient
                colors={gradientColors as unknown as readonly [string, string, ...string[]]}
                style={[
                  styles.badgeCard,
                  achievement.unlocked && styles.badgeCardUnlocked,
                ]}
              >
                <View style={[
                  styles.badgeIconContainer,
                  { 
                    backgroundColor: achievement.unlocked 
                      ? Colors.gold 
                      : Colors.backgroundTertiary 
                  }
                ]}>
                  <IconComponent
                    size={22}
                    color={getIconColor(achievement.unlocked)}
                    strokeWidth={1.5}
                  />
                </View>
                
                <View style={styles.badgeContent}>
                  <Text style={[
                    styles.badgeTitle,
                    !achievement.unlocked && styles.badgeTitleLocked,
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.badgeDescription}>
                    {achievement.description}
                  </Text>
                  
                  <View style={styles.badgeMeta}>
                    {achievement.unlocked ? (
                      <>
                        <View style={styles.statusBadge}>
                          <Check size={10} color={Colors.success} />
                          <Text style={styles.statusText}>Achieved</Text>
                        </View>
                        <Text style={styles.badgeDate}>
                          {achievement.unlockedAt?.toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(progressPercent, 100)}%`,
                                backgroundColor: Colors.accentBlue,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressLabel}>
                          {achievement.progress}/{achievement.target}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_savings',
    title: 'First Step',
    description: 'Complete your first savings transfer',
    icon: 'rocket',
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day savings streak',
    icon: 'flame',
    unlocked: false,
    progress: 5,
    target: 7,
  },
  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Stay under budget for 30 days',
    icon: 'target',
    unlocked: false,
    progress: 18,
    target: 30,
  },
  {
    id: 'wealth_1m',
    title: 'Wealth Builder',
    description: 'Grow net worth to ₹10,00,000',
    icon: 'trending',
    unlocked: true,
    unlockedAt: new Date('2024-02-01'),
  },
  {
    id: 'no_debt',
    title: 'Debt Free',
    description: 'Maintain zero liabilities',
    icon: 'shield',
    unlocked: true,
    unlockedAt: new Date('2024-01-20'),
  },
];
