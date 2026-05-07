/**
 * Kairo — Account Detail Widget
 * Elegant animated widget for displaying specific account statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { GlassCard } from '../common/GlassCard';

interface AccountDetailWidgetProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  progress?: number; // 0 to 100
  color?: string;
}

export const AccountDetailWidget: React.FC<AccountDetailWidgetProps> = ({
  label,
  value,
  icon,
  subtitle,
  progress,
  color = Colors.accentBlue,
}) => {
  return (
    <GlassCard variant="light" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          {icon}
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    minWidth: 160,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    marginVertical: Spacing.xs,
  },
  value: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    color: Colors.textSecondary,
  },
});
