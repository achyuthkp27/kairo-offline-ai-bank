/**
 * Kairo — Tab Navigator Layout
 * Premium bottom tab bar with custom styling
 */

import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, NativeModules } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Bot,
} from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../src/theme';
import { useUIStore } from '../../src/store';
import { LuxeBotFAB } from '../../src/components/ai/LuxeBotFAB';
import { AIAssistantSheet } from '../../src/components/ai/AIAssistantSheet';
import { NotificationSheet } from '../../src/components/notifications/NotificationSheet';
import { llamaEngine } from '../../src/ai/llamaEngine';
import { checkModelExists } from '../../src/ai/modelManager';

export default function TabLayout() {
  const { isAISheetVisible, setAISheetVisible, isNotificationSheetVisible, setNotificationSheetVisible } = useUIStore();

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

  return (
    <>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accentCyan,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
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
    
    <LuxeBotFAB onPress={() => setAISheetVisible(true)} />
    <AIAssistantSheet isVisible={isAISheetVisible} onClose={() => setAISheetVisible(false)} />
    <NotificationSheet isVisible={isNotificationSheetVisible} onClose={() => setNotificationSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: Spacing.xs,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    overflow: 'hidden',
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
