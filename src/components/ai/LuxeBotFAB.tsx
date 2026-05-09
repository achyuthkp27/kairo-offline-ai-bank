/**
 * Kairo — Luxe-Bot FAB
 * Floating action button with a premium pulsing glow effect
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadows } from '../../theme';
import { useHaptics, useThemeColors } from '../../hooks';

interface LuxeBotFABProps {
  onPress: () => void;
  isSheetVisible?: boolean;
}

export const LuxeBotFAB: React.FC<LuxeBotFABProps> = ({ onPress, isSheetVisible }) => {
  const { trigger } = useHaptics();
  const { Colors } = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, glowAnim]);

  const handlePress = () => {
    trigger('medium');
    onPress();
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      shadowColor: '#2E5BFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
    },
    glow: {
      position: 'absolute',
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: Colors.accentBlue,
    },
    hidden: {
      zIndex: -1,
      opacity: 0,
      pointerEvents: 'none',
    },
  }), [Colors]);

  return (
    <Pressable style={[styles.container, isSheetVisible && styles.hidden]} onPress={handlePress}>
      {/* Animated Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />

      {/* Button Surface */}
      <LinearGradient
        colors={['#2E5BFF', '#00D4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <Sparkles size={24} color="#FFFFFF" strokeWidth={2} />
      </LinearGradient>
    </Pressable>
  );
};