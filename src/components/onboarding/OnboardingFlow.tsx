/**
 * Kairo — Onboarding Flow
 * Animated walkthrough with mock accounts and celebration moments
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  ChevronRight, 
  Check,
  CreditCard,
  PiggyBank,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Typography, Spacing, Shadows } from '../../theme';
import { useHaptics, useThemeColors } from '../../hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradientColors: readonly [string, string, ...string[]];
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kairo',
    subtitle: 'Your AI-Powered Banking Partner',
    description: 'Experience the future of personal finance with intelligent insights and seamless controls.',
    icon: <Wallet size={64} color="#fff" />,
    gradientColors: ['#2E5BFF', '#00D4FF'],
  },
  {
    id: 'security',
    title: 'Bank-Grade Security',
    subtitle: 'Your Data Stays With You',
    description: 'All financial data is stored locally on your device. Your privacy is our priority.',
    icon: <Shield size={64} color="#fff" />,
    gradientColors: ['#059669', '#10B981'],
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    subtitle: 'On-Device Intelligence',
    description: 'Get personalized financial advice powered by Llama 3.2, running entirely on your device.',
    icon: <Sparkles size={64} color="#fff" />,
    gradientColors: ['#7C3AED', '#A855F7'],
  },
  {
    id: 'wealth',
    title: 'Grow Your Wealth',
    subtitle: 'Smart Investment Tracking',
    description: 'Monitor your diversified portfolio with real-time insights and projections.',
    icon: <TrendingUp size={64} color="#fff" />,
    gradientColors: ['#F59E0B', '#EF4444'],
  },
  {
    id: 'ready',
    title: "You're All Set!",
    subtitle: 'Let the Journey Begin',
    description: "Your accounts are ready. Let's explore your financial universe.",
    icon: <Check size={64} color="#fff" />,
    gradientColors: ['#22C55E', '#10B981'],
  },
];

const MOCK_ACCOUNTS = [
  {
    id: 'acc_1',
    name: 'Primary Checking',
    type: 'checking' as const,
    balance: 458532.50,
    cardNumber: '4532 •••• •••• 8921',
    expiryDate: '12/28',
    currency: 'INR',
    gradientColors: ['#2E5BFF', '#1E3A8A'],
    cardBrand: 'visa' as const,
    isActive: true,
    isFrozen: false,
    rewardPoints: 2450,
    fdMaturityStatus: 'active',
    creditScore: '782',
    cashbackEarned: 3250,
    sipProgress: 65,
  },
  {
    id: 'acc_2',
    name: 'Savings Account',
    type: 'savings' as const,
    balance: 1250000.00,
    cardNumber: '4532 •••• •••• 3456',
    expiryDate: '09/27',
    currency: 'INR',
    gradientColors: ['#10B981', '#059669'],
    cardBrand: 'mastercard' as const,
    isActive: false,
    isFrozen: false,
    rewardPoints: 1200,
    fdMaturityStatus: 'pending',
    creditScore: '782',
    cashbackEarned: 1800,
    sipProgress: 42,
  },
  {
    id: 'acc_3',
    name: 'Investment Portfolio',
    type: 'investment' as const,
    balance: 3810500.00,
    cardNumber: '•••• •••• •••• ••••',
    expiryDate: '--/--',
    currency: 'INR',
    gradientColors: ['#F59E0B', '#D97706'],
    cardBrand: 'mastercard' as const,
    isActive: false,
    isFrozen: false,
    rewardPoints: 0,
    fdMaturityStatus: 'none',
    creditScore: '782',
    cashbackEarned: 0,
    sipProgress: 0,
  },
];

export const OnboardingFlow: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { Colors } = useThemeColors();
  const { trigger } = useHaptics();
  
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const goToStep = (stepIndex: number) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: stepIndex > currentStep ? -50 : 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    setCurrentStep(stepIndex);
    trigger('light');
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      trigger('success');
      onComplete();
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleSkip = () => {
    trigger('medium');
    onComplete();
    router.replace('/(tabs)/dashboard');
  };

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isReadyStep = step.id === 'ready';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0A1A',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    iconContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing['2xl'],
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize['2xl'],
      color: Colors.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.md,
      color: Colors.accentBlue,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    description: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: Spacing.xl,
    },
    cardPreview: {
      width: SCREEN_WIDTH * 0.75,
      height: 180,
      borderRadius: 24,
      padding: Spacing.xl,
      justifyContent: 'space-between',
      marginTop: Spacing['2xl'],
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cardName: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: 'rgba(255,255,255,0.8)',
    },
    cardBalance: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: '#fff',
      marginTop: Spacing.md,
    },
    cardNumber: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 2,
    },
    skipButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: Spacing.xl,
      padding: Spacing.md,
    },
    skipText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 50 : Spacing.xl,
    },
    progressDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.backgroundTertiary,
    },
    dotActive: {
      width: 24,
      backgroundColor: Colors.accentBlue,
    },
    nextButton: {
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    nextButtonText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      color: Colors.background,
    },
    readyCards: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    miniCard: {
      width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2) / 3,
      height: 100,
      borderRadius: 16,
      padding: Spacing.sm,
      justifyContent: 'space-between',
    },
    miniCardLabel: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: 10,
      color: 'rgba(255,255,255,0.8)',
    },
    miniCardBalance: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: 12,
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#0D0D20', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
      />
      
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={step.gradientColors}
          style={styles.iconContainer}
        >
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          {step.icon}
        </LinearGradient>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {isReadyStep && (
          <View style={styles.readyCards}>
            {MOCK_ACCOUNTS.map((account, index) => (
              <LinearGradient
                key={account.id}
                colors={account.gradientColors as unknown as readonly [string, string, ...string[]]}
                style={styles.miniCard}
              >
                <Text style={styles.miniCardLabel}>{account.name}</Text>
                <Text style={styles.miniCardBalance}>
                  ₹{(account.balance / 100000).toFixed(1)}L
                </Text>
              </LinearGradient>
            ))}
          </View>
        )}

        {!isReadyStep && (step.id === 'welcome' || step.id === 'ai') && (
          <View style={styles.cardPreview}>
            <LinearGradient
              colors={step.gradientColors as unknown as readonly [string, string, ...string[]]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>Achyuth Kp</Text>
              <CreditCard size={24} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.cardBalance}>₹4,58,532.50</Text>
            <Text style={styles.cardNumber}>4532 •••• •••• 8921</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.progressDots}>
          {STEPS.map((s, index) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={isLastStep ? ['#22C55E', '#10B981'] : ['#2E5BFF', '#00D4FF']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Start Banking' : 'Continue'}
          </Text>
          {!isLastStep && <ChevronRight size={20} color={Colors.background} />}
          {isLastStep && <Check size={20} color={Colors.background} />}
        </Pressable>
      </View>
    </View>
  );
};
