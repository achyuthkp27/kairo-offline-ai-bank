/**
 * Kairo — Premium Glass Card
 * Frosted glass container with border glow
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Glassmorphism } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  style,
  glowColor,
}) => {
  const glass = Glassmorphism[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: glass.backgroundColor,
          borderColor: glowColor
            ? `${glowColor}30`
            : glass.borderColor,
        },
        glowColor && {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
});
