/**
 * Kairo — Dashboard Header
 * Premium top section with avatar, greeting, and notifications
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Bell, Moon, Sun } from 'lucide-react-native';
import { Typography, Spacing, Shadows, BorderRadius } from '../../theme';
import { getGreeting, formatDate } from '../../utils/formatters';
import { useUIStore } from '../../store';
import { useThemeColors } from '../../hooks/useTheme';

interface DashboardHeaderProps {
  userName: string;
  avatarUrl?: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLogout?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  avatarUrl,
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
  onLogout,
}) => {
  const { toggleTheme } = useUIStore();
  const { Colors, isDark } = useThemeColors();
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      marginTop: Spacing.xs,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrapper: {
      position: 'relative',
      width: 48,
      height: 48,
    },
    avatarGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: Colors.accentBlue,
      opacity: 0.5,
      ...Shadows.glowBlue,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    avatarInitial: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.accentBlue,
    },
    greetingWrapper: {
      marginLeft: Spacing.md,
    },
    greetingText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textTertiary,
    },
    userNameText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    dateText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.cardSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: Colors.error,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: Colors.background,
    },
    badgeText: {
      color: Colors.textPrimary,
      fontSize: 8,
      fontFamily: Typography.fontFamily.black,
    },
    logoutButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 77, 109, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 77, 109, 0.2)',
      marginLeft: Spacing.sm,
      marginTop: 8,
    },
    logoutText: {
      color: Colors.error,
      fontSize: 10,
      fontFamily: Typography.fontFamily.bold,
      textTransform: 'uppercase',
    },
  }), [Colors]);
  
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Pressable onPress={onProfilePress} style={styles.avatarWrapper}>
          <View style={styles.avatarGlow} />
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{userName.charAt(0)}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.greetingWrapper}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.dateText}>{formatDate().split(',')[0]}</Text>
        <View style={styles.actionsRow}>
          <Pressable 
            onPress={toggleTheme} 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            {isDark ? (
              <Sun size={20} color={Colors.textPrimary} strokeWidth={1.8} />
            ) : (
              <Moon size={20} color={Colors.textPrimary} strokeWidth={1.8} />
            )}
          </Pressable>
          <Pressable 
            onPress={onNotificationPress} 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Bell size={22} color={Colors.textPrimary} strokeWidth={1.8} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable 
            onPress={onLogout} 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
