/**
 * Kairo — Notification Center
 * Premium glassmorphism sheet for managing alerts and insights
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Bell, CheckCheck, Trash2, Zap, Shield, CreditCard, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing } from '../../theme';
import { useHaptics } from '../../hooks';
import { useNotificationStore, KairoNotification } from '../../store/notificationStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotificationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotificationIcon = ({ type }: { type: KairoNotification['type'] }) => {
  switch (type) {
    case 'insight': return <Zap size={18} color={Colors.accentCyan} />;
    case 'security': return <Shield size={18} color={Colors.accentBlue} />;
    case 'transaction': return <CreditCard size={18} color={Colors.success} />;
    default: return <Info size={18} color={Colors.textTertiary} />;
  }
};

export const NotificationSheet: React.FC<NotificationSheetProps> = ({ isVisible, onClose }) => {
  const { trigger } = useHaptics();
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet Content */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Bell size={20} color={Colors.accentBlue} />
            </View>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <View style={styles.headerActions}>
            {notifications.some(n => !n.isRead) && (
              <Pressable 
                onPress={() => { trigger('light'); markAllAsRead(); }} 
                style={styles.actionBtn}
              >
                <CheckCheck size={18} color={Colors.textTertiary} />
              </Pressable>
            )}
            <Pressable 
              onPress={() => { trigger('light'); clearNotifications(); }} 
              style={styles.actionBtn}
            >
              <Trash2 size={18} color={Colors.textTertiary} />
            </Pressable>
            <Pressable onPress={() => { trigger('light'); onClose(); }} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <Pressable 
                key={notif.id}
                onPress={() => {
                  trigger('light');
                  markAsRead(notif.id);
                }}
                style={[
                  styles.notificationItem,
                  !notif.isRead && styles.unreadItem
                ]}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${Colors.backgroundTertiary}` }]}>
                  <NotificationIcon type={notif.type} />
                </View>
                
                <View style={styles.notifBody}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage}>{notif.message}</Text>
                  <Text style={styles.notifTime}>{getTimeAgo(notif.date)}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Bell size={48} color={Colors.cardBorder} strokeWidth={1} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No new notifications at the moment.</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 91, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: 'rgba(46, 91, 255, 0.05)',
    borderColor: 'rgba(46, 91, 255, 0.1)',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notifBody: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentBlue,
  },
  notifMessage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifTime: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
