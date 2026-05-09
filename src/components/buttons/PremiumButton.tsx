/**
 * Kairo — Premium Button
 * Animated button with gradient, glow, and press effects
 */

import React, { useRef, useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const { Colors } = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    base: {
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    gradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      minHeight: 56,
    },
    primaryText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      letterSpacing: Typography.letterSpacing.wide,
    },
    secondary: {
      backgroundColor: Colors.cardSurface,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing['2xl'],
      minHeight: 56,
    },
    secondaryText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textSecondary,
    },
    ghost: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
    },
    ghostText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textTertiary,
    },
    disabled: {
      opacity: 0.5,
    },
  }), [Colors]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          { transform: [{ scale }] },
          !isDisabled && Shadows.glowBlue,
          style,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={[styles.base, isDisabled && styles.disabled]}
        >
          <LinearGradient
            colors={
              isDisabled
                ? ['#1a1f3d', '#151a30']
                : ['#2E5BFF', '#1a3dcc', '#0033CC']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <>
                {icon && <>{icon}</>}
                <Text
                  style={[
                    styles.primaryText,
                    icon ? { marginLeft: Spacing.sm } : undefined,
                  ]}
                >
                  {title}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={[styles.base, styles.secondary, isDisabled && styles.disabled]}
        >
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.secondaryText,
              icon ? { marginLeft: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // Ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.ghost, style]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.ghostText,
          icon ? { marginLeft: Spacing.sm } : undefined,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};
