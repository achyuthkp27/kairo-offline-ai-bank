/**
 * Kairo — AI Assistant Screen (Placeholder)
 * Will be fully built in Step 6
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/theme';

export default function AIScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Luxe-Bot</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>AI Concierge — Coming in Step 6</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.cardSurface,
    borderRadius: 24,
    padding: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
  },
});
