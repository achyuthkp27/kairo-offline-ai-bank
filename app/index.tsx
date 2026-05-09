/**
 * Kairo — Premium Login Screen
 * Cinematic authentication gate with animated gradient mesh,
 * floating orbs, glassmorphism card, and shake error animation
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  User,
  Lock,
  ScanFace,
  ChevronRight,
} from 'lucide-react-native';

import { useAuthStore } from '../src/store';
import { useHaptics, useThemeColors } from '../src/hooks';
import { AnimatedOrb } from '../src/components/common/AnimatedOrb';
import { GlassCard } from '../src/components/common/GlassCard';
import { PremiumInput } from '../src/components/inputs/PremiumInput';
import { PremiumButton } from '../src/components/buttons/PremiumButton';
import { Typography, Spacing, Gradients } from '../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const { login, register, isLoading, error, clearError, isFirstLaunch, isCheckingFirstLaunch, checkFirstLaunch, biometricLogin, setRememberedDevice, isDeviceRemembered } = useAuthStore();
  const { trigger } = useHaptics();
  const { Colors, isDark } = useThemeColors();

  const isRegistering = isFirstLaunch && !isCheckingFirstLaunch;

  const gradientColors: [string, string, string, string] = isDark
    ? ['#050510', '#0A0A1A', '#0D0D20', '#050510']
    : ['#F5F5F7', '#FFFFFF', '#F0F0F2', '#F5F5F7'];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#050510' : '#F5F5F7',
    },
    contentWrapper: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing['3xl'],
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: Spacing['3xl'],
    },
    logoMark: {
      marginBottom: Spacing.lg,
    },
    logoImage: {
      width: 80,
      height: 80,
      borderRadius: 20,
    },
    logoText: {
      fontFamily: Typography.fontFamily.black,
      fontSize: Typography.fontSize['4xl'],
      color: Colors.textPrimary,
      letterSpacing: Typography.letterSpacing.widest + 4,
    },
    logoSubtext: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.textMuted,
      letterSpacing: Typography.letterSpacing.widest + 2,
      marginTop: Spacing.xs,
    },
    loginCard: {
      borderWidth: 0,
    },
    cardContent: {
      padding: Spacing.xl,
    },
    cardTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    cardSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textTertiary,
      marginBottom: Spacing.xl,
    },
    inputsContainer: {
      marginBottom: Spacing.sm,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    toggleTrack: {
      width: 40,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)',
      padding: 2,
      justifyContent: 'center',
    },
    toggleTrackActive: {
      backgroundColor: Colors.accentBlue,
    },
    toggleThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: Colors.textTertiary,
    },
    toggleThumbActive: {
      alignSelf: 'flex-end',
      backgroundColor: Colors.textPrimary,
    },
    rememberText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginLeft: Spacing.md,
    },
    loginButton: {
      marginBottom: Spacing.lg,
    },
    separator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.divider,
    },
    separatorText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
      marginHorizontal: Spacing.base,
    },
    footer: {
      alignItems: 'center',
      marginTop: Spacing['2xl'],
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(0, 255, 153, 0.06)' : 'rgba(0, 204, 102, 0.08)',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.base,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 255, 153, 0.10)' : 'rgba(0, 204, 102, 0.15)',
    },
    securityText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.success,
      marginLeft: Spacing.sm,
      letterSpacing: Typography.letterSpacing.wide,
    },
  }), [Colors, isDark]);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeInLogo = useRef(new Animated.Value(0)).current;
  const fadeInCard = useRef(new Animated.Value(0)).current;
  const slideUpCard = useRef(new Animated.Value(40)).current;
  const fadeInFooter = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(1)).current;
  const errorBorderFlash = useRef(new Animated.Value(0)).current;

  // Entrance animations
  useEffect(() => {
    const sequence = Animated.stagger(200, [
      Animated.timing(fadeInLogo, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeInCard, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideUpCard, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeInFooter, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);
    sequence.start();
  }, []);

  // Check first launch on mount
  useEffect(() => {
    checkFirstLaunch();
  }, []);

  // Auto-login if device is remembered
  useEffect(() => {
    if (isCheckingFirstLaunch) return;

    const checkRemembered = async () => {
      try {
        const remembered = await isDeviceRemembered();
        if (remembered) {
          setRememberDevice(true);
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (compatible && enrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Welcome back to Kairo',
              fallbackLabel: 'Use Password',
              disableDeviceFallback: false,
            });
            if (result.success) {
              const success = await biometricLogin();
              if (success) {
                router.replace('/(tabs)/dashboard');
              }
            }
          }
        }
      } catch (e) {
        console.log('Auto-login check failed:', e);
      }
    };
    setTimeout(checkRemembered, 1200);
  }, [isCheckingFirstLaunch]);

  // Shake animation for errors
  const triggerShake = useCallback(() => {
    trigger('error');
    
    // Flash error border
    Animated.sequence([
      Animated.timing(errorBorderFlash, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(errorBorderFlash, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();

    // Shake sequence
    const shakeValues = [-12, 12, -10, 10, -6, 6, -3, 3, 0];
    const animations = shakeValues.map((toValue) =>
      Animated.timing(shakeAnim, {
        toValue,
        duration: 50,
        useNativeDriver: true,
      })
    );
    Animated.sequence(animations).start();
  }, [trigger, shakeAnim, errorBorderFlash]);

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      triggerShake();
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      triggerShake();
      return;
    }

    clearError();

    const success = isRegistering
      ? await register(userId.trim(), password.trim())
      : await login(userId.trim(), password.trim());

    if (success) {
      trigger('success');
      if (rememberDevice) {
        await setRememberedDevice();
      }
      Animated.parallel([
        Animated.timing(successScale, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(tabs)/dashboard');
      });
    } else {
      triggerShake();
    }
  };

  const handleBiometricLogin = async () => {
    trigger('light');
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Biometric Not Available', 'This device does not support Face ID or Touch ID.');
        triggerShake();
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Biometric Not Set Up', 'Please enable Face ID or Touch ID in your device Settings.');
        triggerShake();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Kairo',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        trigger('success');
        const success = await biometricLogin();
        if (success) {
          await setRememberedDevice();
          Animated.parallel([
            Animated.timing(successScale, {
              toValue: 0.95,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.replace('/(tabs)/dashboard');
          });
        } else {
          triggerShake();
        }
      }
    } catch (e) {
      console.error('Biometric auth error:', e);
      triggerShake();
    }
  };

  const errorBorderColor = errorBorderFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 77, 109, 0.60)'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Animated Background */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedOrb
          size={280}
          colors={Gradients.orbBlue}
          initialX={-80}
          initialY={SCREEN_HEIGHT * 0.15}
          duration={8000}
          delay={0}
          floatRange={25}
        />
        <AnimatedOrb
          size={220}
          colors={Gradients.orbCyan}
          initialX={SCREEN_WIDTH - 120}
          initialY={SCREEN_HEIGHT * 0.08}
          duration={7000}
          delay={400}
          floatRange={20}
        />
        <AnimatedOrb
          size={180}
          colors={Gradients.orbPurple}
          initialX={SCREEN_WIDTH * 0.3}
          initialY={SCREEN_HEIGHT * 0.7}
          duration={9000}
          delay={800}
          floatRange={30}
        />
        <AnimatedOrb
          size={120}
          colors={Gradients.orbBlue}
          initialX={SCREEN_WIDTH * 0.6}
          initialY={SCREEN_HEIGHT * 0.55}
          duration={6000}
          delay={1200}
          floatRange={15}
        />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: successOpacity,
            transform: [{ scale: successScale }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <Animated.View
              style={[styles.logoSection, { opacity: fadeInLogo }]}
            >
              <View style={styles.logoMark}>
                <Image
                  source={require('../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoText}>KAIRO</Text>
              <Text style={styles.logoSubtext}>PREMIUM BANKING</Text>
            </Animated.View>

            {/* Login Card */}
            <Animated.View
              style={[
                {
                  opacity: fadeInCard,
                  transform: [
                    { translateY: slideUpCard },
                    { translateX: shakeAnim },
                  ],
                },
              ]}
            >
              <Animated.View style={{ borderColor: errorBorderColor, borderWidth: 1, borderRadius: 24 }}>
                <GlassCard
                  variant="medium"
                  style={styles.loginCard}
                  glowColor={error ? Colors.error : undefined}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                      {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {isRegistering ? 'Set up your Kairo banking assistant' : 'Sign in to access your accounts'}
                    </Text>

                    <View style={styles.inputsContainer}>
                      <PremiumInput
                        label="User ID"
                        value={userId}
                        onChangeText={(text) => {
                          setUserId(text);
                          if (error) clearError();
                        }}
                        placeholder="Enter your User ID"
                        error={!!error}
                        icon={
                          <User
                            size={18}
                            color={error ? Colors.error : Colors.textTertiary}
                            strokeWidth={1.8}
                          />
                        }
                      />

                      <PremiumInput
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (error) clearError();
                        }}
                        placeholder="Enter your password"
                        secureTextEntry
                        error={!!error}
                        errorMessage={error || undefined}
                        icon={
                          <Lock
                            size={18}
                            color={error ? Colors.error : Colors.textTertiary}
                            strokeWidth={1.8}
                          />
                        }
                      />
                    </View>

                    {isRegistering && (
                      <PremiumInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your password"
                        secureTextEntry
                        error={!!error}
                        icon={
                          <Lock
                            size={18}
                            color={error ? Colors.error : Colors.textTertiary}
                            strokeWidth={1.8}
                          />
                        }
                      />
                    )}

                    {/* Remember Device Toggle */}
                    <Pressable
                      onPress={() => setRememberDevice(!rememberDevice)}
                      style={styles.rememberRow}
                    >
                      <View
                        style={[
                          styles.toggleTrack,
                          rememberDevice && styles.toggleTrackActive,
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.toggleThumb,
                            rememberDevice && styles.toggleThumbActive,
                          ]}
                        />
                      </View>
                      <Text style={styles.rememberText}>Remember this device</Text>
                    </Pressable>

                    {/* Login Button */}
                    <PremiumButton
                      title={isRegistering ? 'Create Account' : 'Sign In Securely'}
                      onPress={handleLogin}
                      loading={isLoading}
                      icon={
                        !isLoading ? (
                          <ChevronRight
                            size={18}
                            color={Colors.textPrimary}
                            strokeWidth={2}
                          />
                        ) : undefined
                      }
                      style={styles.loginButton}
                    />

                    {/* Separator */}
                    <View style={styles.separator}>
                      <View style={styles.separatorLine} />
                      <Text style={styles.separatorText}>or</Text>
                      <View style={styles.separatorLine} />
                    </View>

                    {/* Face ID Button */}
                    <PremiumButton
                      title="Sign in with Face ID"
                      onPress={handleBiometricLogin}
                      variant="secondary"
                      icon={
                        <ScanFace
                          size={20}
                          color={Colors.textSecondary}
                          strokeWidth={1.8}
                        />
                      }
                    />
                  </View>
                </GlassCard>
              </Animated.View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              style={[styles.footer, { opacity: fadeInFooter }]}
            >
              <View style={styles.securityBadge}>
                <Lock size={12} color={Colors.success} strokeWidth={2} />
                <Text style={styles.securityText}>
                  256-bit encrypted · Secured by Kairo
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
