/**
 * Kairo — Animation Presets
 * Reusable animation configurations for premium interactions
 */

import { Easing } from 'react-native-reanimated';

export const ANIMATION_PRESETS = {
  // Spring configurations
  spring: {
    gentle: {
      damping: 20,
      stiffness: 180,
      mass: 1,
    },
    snappy: {
      damping: 15,
      stiffness: 300,
      mass: 0.8,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
      mass: 0.6,
    },
    slow: {
      damping: 25,
      stiffness: 120,
      mass: 1.2,
    },
    card: {
      damping: 18,
      stiffness: 250,
      mass: 0.9,
    },
  },

  // Timing configurations
  timing: {
    fast: {
      duration: 150,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    normal: {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    smooth: {
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    },
    cinematic: {
      duration: 600,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
    dramatic: {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
    fadeIn: {
      duration: 400,
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
    },
    fadeOut: {
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 1, 1),
    },
  },

  // Shake animation values (for error states)
  shake: {
    values: [-10, 10, -8, 8, -5, 5, -2, 2, 0],
    duration: 50, // per segment
  },
} as const;

/**
 * Stagger delay calculator for list animations
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

/**
 * Generate a parallax offset based on scroll position
 */
export const getParallaxOffset = (
  scrollY: number,
  itemOffset: number,
  speed: number = 0.5
): number => {
  return (scrollY - itemOffset) * speed;
};
