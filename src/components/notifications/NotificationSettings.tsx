import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ViewStyle, ScrollView } from 'react-native';
import { CreditCard, Wallet, Clock, Bell, Shield } from 'lucide-react-native';

import { Typography, Spacing, BorderRadius } from '../../theme';
import { useNotifications } from '../../hooks/useNotifications';
import { useThemeColors, useHaptics } from '../../hooks';
import { NotificationCategory } from '../../services/NotificationService';
import { GlassCard } from '../common/GlassCard';

type ThemeColors = ReturnType<typeof useThemeColors>['Colors'];

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  Colors: ThemeColors;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
  Colors,
}) => {
  const { trigger } = useHaptics();

  return (
    <Pressable
      onPress={() => {
        trigger('light');
        onToggle();
      }}
      style={[styles.settingRow, { backgroundColor: Colors.cardSurface }]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: Colors.accentBlueSoft }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: Colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={() => {
          trigger('medium');
          onToggle();
        }}
        trackColor={{ false: Colors.backgroundTertiary, true: Colors.accentBlue }}
        thumbColor={enabled ? '#FFFFFF' : Colors.textMuted}
        ios_backgroundColor={Colors.backgroundTertiary}
      />
    </Pressable>
  );
};

export const NotificationSettings: React.FC = () => {
  const { Colors } = useThemeColors();
  const { preferences, toggleCategory, permissionsGranted } = useNotifications();

  const categories: { key: NotificationCategory; icon: React.ReactNode; title: string; description: string }[] = [
    {
      key: 'transaction_alerts',
      icon: <CreditCard size={18} color={Colors.accentBlue} />,
      title: 'Transaction Alerts',
      description: 'Instant alerts for all spending',
    },
    {
      key: 'balance_warnings',
      icon: <Shield size={18} color={Colors.warning} />,
      title: 'Security & Balance',
      description: 'Warnings and suspicious activity',
    },
    {
      key: 'payment_reminders',
      icon: <Clock size={18} color={Colors.accentCyan} />,
      title: 'Scheduled Payments',
      description: 'Reminders for bills and EMIs',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.accentBlue + '15' }]}>
          <Bell size={24} color={Colors.accentBlue} />
        </View>
        <Text style={[styles.title, { color: Colors.textPrimary }]}>Notifications</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
          Configure how and when you want to be notified about your finances
        </Text>
      </View>

      {!permissionsGranted && (
        <GlassCard variant="light" style={styles.permissionBanner}>
          <Text style={[styles.permissionText, { color: Colors.warning }]}>
            Push notifications are disabled in system settings.
          </Text>
        </GlassCard>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Alert Preferences</Text>
        <View style={styles.rowsContainer}>
          {categories.map((cat, index) => (
            <React.Fragment key={cat.key}>
              <SettingRow
                icon={cat.icon}
                title={cat.title}
                description={cat.description}
                enabled={preferences.get(cat.key) ?? true}
                onToggle={() => toggleCategory(cat.key)}
                Colors={Colors}
              />
              {index < categories.length - 1 && (
                <View style={[styles.separator, { backgroundColor: Colors.border + '30' }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: Colors.backgroundTertiary + '50' }]}>
        <Shield size={16} color={Colors.textTertiary} />
        <Text style={[styles.infoText, { color: Colors.textTertiary }]}>
          Kairo uses end-to-end encryption for all sensitive alerts.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  rowsContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 16,
  },
  settingDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  permissionBanner: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  permissionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    flex: 1,
  },
});