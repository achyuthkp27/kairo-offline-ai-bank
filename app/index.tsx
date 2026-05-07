/**
 * Kairo — Premium Login Screen
 * Cinematic authentication gate with animated gradient mesh,
 * floating orbs, glassmorphism card, and shake error animation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  User,
  Lock,
  ScanFace,
  Shield,
  ChevronRight,
} from 'lucide-react-native';

import { useAuthStore } from '../src/store';
import { useHaptics } from '../src/hooks';
import { AnimatedOrb } from '../src/components/common/AnimatedOrb';
import { GlassCard } from '../src/components/common/GlassCard';
import { PremiumInput } from '../src/components/inputs/PremiumInput';
import { PremiumButton } from '../src/components/buttons/PremiumButton';
import { Colors, Typography, Spacing, Gradients } from '../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();
  const { trigger } = useHaptics();

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

    clearError();
    const success = await login(userId.trim(), password.trim());

    if (success) {
      trigger('success');
      // Cinematic exit animation
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

  const errorBorderColor = errorBorderFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 77, 109, 0.60)'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Animated Background */}
      <LinearGradient
        colors={['#050510', '#0A0A1A', '#0D0D20', '#050510']}
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
                <LinearGradient
                  colors={['#2E5BFF', '#00D4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Shield size={28} color="#fff" strokeWidth={2} />
                </LinearGradient>
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
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardSubtitle}>
                      Sign in to access your accounts
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
                      title="Sign In Securely"
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
                      onPress={() => {
                        trigger('light');
                      }}
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
                <Shield size={12} color={Colors.success} strokeWidth={2} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
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

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoMark: {
    marginBottom: Spacing.lg,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Login Card
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

  // Remember Device
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
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

  // Login Button
  loginButton: {
    marginBottom: Spacing.lg,
  },

  // Separator
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 153, 0.06)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 153, 0.10)',
  },
  securityText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    marginLeft: Spacing.sm,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
