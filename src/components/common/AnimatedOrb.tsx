/**
 * Kairo — Animated Floating Orb
 * Creates a glowing, floating sphere for premium background effects
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedOrbProps {
  size: number;
  colors: readonly string[];
  initialX: number;
  initialY: number;
  duration?: number;
  delay?: number;
  floatRange?: number;
}

export const AnimatedOrb: React.FC<AnimatedOrbProps> = ({
  size,
  colors,
  initialX,
  initialY,
  duration = 6000,
  delay = 0,
  floatRange = 30,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      delay,
      useNativeDriver: true,
    }).start();

    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: duration * 0.6,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: duration * 0.6,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float Y
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -floatRange,
          duration: duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: floatRange,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float X
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: floatRange * 0.6,
          duration: duration * 1.3,
          delay: delay + 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -floatRange * 0.6,
          duration: duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: initialX,
          top: initialY,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={colors as unknown as readonly [string, string, ...string[]]}
        style={[styles.gradient, { borderRadius: size / 2 }]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
});
