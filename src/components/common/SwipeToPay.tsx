/**
 * Kairo — Swipe To Pay Component
 * Animated swipe gesture for confirming payments
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Check } from 'lucide-react-native';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

interface SwipeToPayProps {
  onSwipeComplete: () => void;
  label?: string;
  disabled?: boolean;
}

export const SwipeToPay: React.FC<SwipeToPayProps> = ({
  onSwipeComplete,
  label = 'Slide to Pay',
  disabled = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isComplete = useRef(false);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(event.translationX, SWIPE_THRESHOLD + 20));
      translateX.setValue(newX);
      
      if (newX >= SWIPE_THRESHOLD && !isComplete.current) {
        isComplete.current = true;
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
        }).start();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (newX < SWIPE_THRESHOLD) {
        isComplete.current = false;
        scale.setValue(1);
      }
    })
    .onEnd(() => {
      if (isComplete.current) {
        Animated.timing(translateX, {
          toValue: SWIPE_THRESHOLD,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeComplete();
          setTimeout(() => {
            translateX.setValue(0);
            scale.setValue(1);
            isComplete.current = false;
          }, 1500);
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }).start();
      }
    });

  const thumbStyle = {
    transform: [
      { translateX },
      { scale },
    ],
  };

  const progressWidth = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, { width: progressWidth }]} />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.slideText}>
          <ArrowRight size={16} color="rgba(255,255,255,0.5)" />
        </Text>
      </View>
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          {isComplete.current ? (
            <Check size={24} color="#fff" />
          ) : (
            <ArrowRight size={24} color="#fff" />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(46, 91, 255, 0.2)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(46, 91, 255, 0.6)',
    borderRadius: 30,
  },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 20,
  },
  slideText: {
    marginRight: 10,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E5BFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2E5BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
