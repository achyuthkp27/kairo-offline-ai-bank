/**
 * Kairo — Tab Navigator Layout
 * Premium bottom tab bar with custom styling
 */

import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, NativeModules, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Bot,
  WifiOff,
} from 'lucide-react-native';
import { Typography, Spacing, BorderRadius } from '../../src/theme';
import { useUIStore } from '../../src/store';
import { useThemeColors } from '../../src/hooks/useTheme';
import { LuxeBotFAB } from '../../src/components/ai/LuxeBotFAB';
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

export default function TabLayout() {
  const { isAISheetVisible, setAISheetVisible, isNotificationSheetVisible, setNotificationSheetVisible } = useUIStore();
  const { Colors, isDark } = useThemeColors();

  // Eagerly initialize the AI engine as soon as user reaches the dashboard
  useEffect(() => {
    const eagerInit = async () => {
      // Skip entirely if native module isn't available (Expo Go)
      if (!NativeModules.RNLlama) return;
      
      try {
        const exists = await checkModelExists();
        if (exists) {
          console.log('[TabLayout] Eagerly initializing AI engine...');
          await llamaEngine.initializeModel();
          console.log('[TabLayout] AI engine ready in background!');
        }
      } catch (e) {
        console.log('[TabLayout] Eager init failed (will retry when sheet opens):', e);
      }
    };
    eagerInit();
  }, []);

  const tabBarColor = isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(245, 245, 247, 0.85)';
  const tabBarBorder = isDark ? Colors.divider : 'rgba(0, 0, 0, 0.1)';

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
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Luxe-Bot',
          tabBarIcon: ({ color, size }) => (
            <Bot size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
    
    <LuxeBotFAB onPress={() => setAISheetVisible(true)} isSheetVisible={isAISheetVisible} />
    <AIAssistantSheet isVisible={isAISheetVisible} onClose={() => setAISheetVisible(false)} />
    <NotificationSheet isVisible={isNotificationSheetVisible} onClose={() => setNotificationSheetVisible(false)} />
    <OfflineIndicator />
    </>
  );
}
