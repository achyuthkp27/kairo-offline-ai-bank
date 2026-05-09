/**
 * Kairo — Root Layout
 * Loads fonts, providers, and manages the root navigation stack
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Network from 'expo-network';
import { Typography } from '../src/theme';
import { initDatabase } from '../src/db/database';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
import { useUIStore } from '../src/store';
import { useThemeColors } from '../src/hooks/useTheme';

export default function RootLayout() {
  const { Colors, isDark } = useThemeColors();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: Colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [Colors]);

  useEffect(() => {
    initDatabase().then(() => {
      setTimeout(() => {
        import('../src/ai/llamaEngine').then(({ llamaEngine }) => {
          llamaEngine.runAnomalyDetection();
        });
      }, 5000);
    });

    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      useUIStore.getState().setOnline(state.isConnected ?? false);
    };
    checkNetwork();
    const unsubscribe = Network.addNetworkStateListener((state) => {
      useUIStore.getState().setOnline(state.isConnected ?? false);
    });
    return () => unsubscribe.remove();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="accounts" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="bills" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        </Stack>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
