/**
 * Kairo — Tab Navigator Layout
 * Premium bottom tab bar with custom styling
 */

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, NativeModules, Text, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  WifiOff,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '../../src/hooks';
import { Typography, Spacing } from '../../src/theme';
import { useUIStore } from '../../src/store';
import { useThemeColors } from '../../src/hooks/useTheme';
import { AIAssistantSheet } from '../../src/components/ai/AIAssistantSheet';
import { NotificationSheet } from '../../src/components/notifications/NotificationSheet';
import { llamaEngine } from '../../src/ai/llamaEngine';
import { checkModelExists } from '../../src/ai/modelManager';

function OfflineIndicator() {
  const isOnline = useUIStore((state) => state.isOnline);
  const { Colors } = useThemeColors();

  if (isOnline) return null;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      backgroundColor: Colors.error + '20',
      borderBottomWidth: 1, borderBottomColor: Colors.error,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.xs, gap: Spacing.xs, zIndex: 1000,
    }}>
      <WifiOff size={14} color={Colors.error} />
      <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.error }}>Offline Mode</Text>
    </View>
  );
}

const AIFabButton = ({ onPress, Colors }: { onPress: () => void; Colors: any }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.55, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.18, duration: 1800, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, glowAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 15,
        right: 20,
        width: 82,
        height: 82,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: Colors.accentBlue,
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          }}
        />
        <LinearGradient
          colors={['#2E5BFF', '#00D4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 35,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 8,
            shadowColor: '#2E5BFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Sparkles size={23} color="#FFFFFF" strokeWidth={2} style={{ marginLeft: -15 }} />
        </LinearGradient>
      </View>
    </Pressable>
  );
};

export default function TabLayout() {
  const { isAISheetVisible, setAISheetVisible, isNotificationSheetVisible, setNotificationSheetVisible } = useUIStore();
  const { Colors, isDark } = useThemeColors();
  const { trigger } = useHaptics();

  useEffect(() => {
    const eagerInit = async () => {
      if (!NativeModules.RNLlama) return;
      try {
        const exists = await checkModelExists();
        if (exists) {
          console.log('[TabLayout] Eagerly initializing AI engine...');
          await llamaEngine.initializeModel();
          console.log('[TabLayout] AI engine ready in background!');
        }
      } catch (e) {
        console.log('[TabLayout] Eager init failed:', e);
      }
    };
    eagerInit();
  }, []);

  const tabBarColor = isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(245, 245, 247, 0.85)';
  const tabBarBorder = isDark ? Colors.divider : 'rgba(0, 0, 0, 0.1)';

  const handleAIPress = () => {
    trigger('light');
    setAISheetVisible(true);
  };

  return (
    <>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accentCyan,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: Typography.fontFamily.medium, fontSize: 10, letterSpacing: 0.3, marginTop: 2 },
        tabBarStyle: { position: 'absolute' as const, backgroundColor: 'transparent' as const, borderTopWidth: 0, elevation: 0, height: Platform.OS === 'ios' ? 88 : 68, paddingTop: Spacing.xs },
        tabBarBackground: () => (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: tabBarColor, borderTopWidth: 1, borderTopColor: tabBarBorder, overflow: 'hidden' }}>
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="wealth"
        options={{
          title: 'Wealth',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>

    <AIFabButton onPress={handleAIPress} Colors={Colors} />
    <AIAssistantSheet isVisible={isAISheetVisible} onClose={() => setAISheetVisible(false)} />
    <NotificationSheet isVisible={isNotificationSheetVisible} onClose={() => setNotificationSheetVisible(false)} />
    <OfflineIndicator />
    </>
  );
}