/**
 * Kairo — Custom Refresh Control
 * Animated pull-to-refresh with stunning visual feedback
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Typography, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PULL_THRESHOLD = 100;

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
}) => {
  const pullAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isRefreshing = useRef(false);

  useEffect(() => {
    if (refreshing) {
      isRefreshing.current = true;
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      isRefreshing.current = false;
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      Animated.spring(pullAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [refreshing, pullAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pullAnim.interpolate({
    inputRange: [0, PULL_THRESHOLD],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  const opacity = pullAnim.interpolate({
    inputRange: [0, 30, PULL_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Animated.View style={{ transform: [{ rotate: spin }, { scale }] }}>
          <RefreshCw size={28} color="#2E5BFF" />
        </Animated.View>
        <Text style={styles.text}>
          {refreshing ? 'Refreshing...' : 'Pull to refresh'}
        </Text>
      </Animated.View>
      
      <View style={styles.indicatorContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E5BFF',
  },
});
