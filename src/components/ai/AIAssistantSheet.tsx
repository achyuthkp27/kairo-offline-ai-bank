/**
 * Kairo — AI Assistant Bottom Sheet
 * Premium chat UI with streaming text, timestamps, and voice input
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { X, Sparkles, Lock, Square, Trash2, Mic, ArrowUp, MicOff, Shield, TrendingUp, Wallet, ArrowRight, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

import { Typography, Spacing, BorderRadius } from '../../theme';
import { useHaptics, useThemeColors } from '../../hooks';
import { useLlama } from '../../hooks/useLlama';
import { useUIStore, useAccountStore, useAuthStore } from '../../store';
import type { AIAction } from '../../store/chatStore';
import { formatCurrency, getGreeting } from '../../utils/formatters';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIAssistantSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant' | 'bot';
  isStreaming?: boolean;
  timestamp?: Date;
}

const QUICK_ACTIONS = [
  { id: 'networth', label: 'Net Worth', icon: '₹' },
  { id: 'budget', label: 'Budget', icon: '📊' },
  { id: 'transfer', label: 'Transfer', icon: '💸' },
  { id: 'portfolio', label: 'Portfolio', icon: '📈' },
];

const STARTER_PROMPTS = [
  {
    id: 'prompt-spending',
    title: 'Where did I overspend this week?',
    subtitle: 'Spot leaks across subscriptions, dining, and impulse buys.',
  },
  {
    id: 'prompt-savings',
    title: 'How much can I safely save this month?',
    subtitle: 'Balance bills, EMI, and investing without hurting cash flow.',
  },
  {
    id: 'prompt-transfer',
    title: 'Help me plan a smart transfer',
    subtitle: 'Move money between accounts with context on impact.',
  },
  {
    id: 'prompt-wealth',
    title: 'Summarize my portfolio health',
    subtitle: 'Review allocation, momentum, and what needs attention.',
  },
];

const ThinkingIndicator = ({ styles }: { styles: ReturnType<typeof StyleSheet.create> }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={styles.thinkingContainer}>
      <View style={styles.thinkingDots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.thinkingDot,
              {
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.thinkingText}>Analyzing your finances...</Text>
    </View>
  );
};

const ListeningPulse = ({ Colors, styles }: { Colors: any, styles: any }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 2, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.listeningOverlay}>
      <Animated.View style={[
        styles.listeningCircle, 
        { 
          transform: [{ scale }], 
          opacity,
          backgroundColor: Colors.accentBlue 
        }
      ]} />
      <View style={[styles.listeningMicContainer, { backgroundColor: Colors.accentBlue }]}>
        <Mic size={24} color="#FFF" />
      </View>
      <Text style={[styles.listeningText, { color: Colors.textPrimary }]}>Listening...</Text>
      <Text style={[styles.listeningSub, { color: Colors.textSecondary }]}>Kairo is analyzing your voice</Text>
    </View>
  );
};

const CursorBlink = () => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={{ color: '#2E5BFF', fontWeight: 'bold' }}>
      {visible ? '|' : ''}
    </Text>
  );
};

export const AIAssistantSheet: React.FC<AIAssistantSheetProps> = ({ isVisible, onClose }) => {
  const { trigger } = useHaptics();
  const { Colors, isDark } = useThemeColors();
  const { initialAIQuery, setInitialAIQuery } = useUIStore();
  const accounts = useAccountStore((state) => state.accounts);
  const accountDetails = useAccountStore((state) => state.accountDetails);
  const userId = useAuthStore((state) => state.userId);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [pendingVoiceText, setPendingVoiceText] = useState<string | null>(null);
  const [inputDisplayText, setInputDisplayText] = useState('');
  
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSheetMounted, setIsSheetMounted] = useState(false);

  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    if (isVisible && !isVisibleRef.current) {
      isVisibleRef.current = true;
      setIsSheetMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else if (!isVisible && isVisibleRef.current) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        if (mountedRef.current) setIsSheetMounted(false);
        isVisibleRef.current = false;
      });
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const WORD_TO_TAB: Record<string, string> = {
    investment: 'wealth', investments: 'wealth', portfolio: 'wealth', wealth: 'wealth',
    stocks: 'wealth', funds: 'wealth', crypto: 'wealth',
    dashboard: 'dashboard', home: 'dashboard',
    transaction: 'transactions', transactions: 'transactions', activity: 'transactions',
    ai: 'ai', chat: 'ai',
  };

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    try {
      Speech.stop();
      setIsSpeaking(true);
      setSpeakingMessageId(null);
      await Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.85 });
    } catch (e) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    } catch (e) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleAction = useCallback((action: AIAction) => {
    if (!action?.action) return;
    trigger('light');

    if (action.action === 'navigate' && action.details) {
      const words = action.details.toLowerCase().trim().split(/\s+/);
      let resolvedTab: string | null = null;
      
      for (const word of words) {
        if (WORD_TO_TAB[word]) {
          resolvedTab = WORD_TO_TAB[word];
          break;
        }
      }
      
      if (resolvedTab) {
        onCloseRef.current();
        setTimeout(() => {
          router.navigate(`/(tabs)/${resolvedTab}` as any);
        }, 400);
      }
    } else {
      Alert.alert('Kairo Action', `Executing: ${action.action}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'default' },
      ]);
    }
  }, [trigger, router]);

  const { 
    messages, 
    isInitializing, 
    isTyping, 
    isDownloading, 
    downloadProgress,
    totalSize,
    downloadedSize,
    isPaused,
    modelExists,
    modelReady,
    isNativeAvailable,
    handleDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cancelGeneration,
    sendMessage,
    clearChat,
  } = useLlama(handleAction);

  const mountedRef = useRef(true);
  const voiceSetupRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isListening && pendingVoiceText) {
      const textToSend = pendingVoiceText;
      setPendingVoiceText(null);
      trigger('light');
      setInputText('');
      setInputDisplayText('');
      sendMessage(textToSend);
    }
  }, [isListening, pendingVoiceText, trigger, sendMessage]);

  useEffect(() => {
    if (voiceSetupRef.current) return;
    voiceSetupRef.current = true;

    let show: ReturnType<typeof Keyboard.addListener> | null = null;
    let hide: ReturnType<typeof Keyboard.addListener> | null = null;

    try {
      show = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          if (mountedRef.current) {
            setIsKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates.height);
          }
        }
      );
      hide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          if (mountedRef.current) {
            setIsKeyboardVisible(false);
            setKeyboardHeight(0);
          }
        }
      );
    } catch (setupErr) {
      voiceSetupRef.current = false;
      return;
    }

    Voice.onSpeechStart = () => {
      if (!mountedRef.current) return;
      try { Speech.stop(); } catch (_) {}
      if (mountedRef.current) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setPartialResults([]);
        setPendingVoiceText(null);
        setInputDisplayText('');
        setIsListening(true);
        trigger('light');
      }
    };
    Voice.onSpeechEnd = () => {
      if (mountedRef.current) setIsListening(false);
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      if (!mountedRef.current) return;
      console.error('Speech Error:', e);
      if (mountedRef.current) {
        setIsListening(false);
        setPartialResults([]);
        setPendingVoiceText(null);
        setInputDisplayText('');
      }
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (!mountedRef.current) return;
      if (e.value) {
        setPartialResults(e.value);
        setInputDisplayText(e.value[e.value.length - 1] || '');
      }
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (!mountedRef.current) return;
      const finalText = (e.value && e.value[0]) ? e.value[0].trim() : null;
      if (mountedRef.current) {
        setIsListening(false);
        setPartialResults([]);
        setInputDisplayText('');
        if (finalText) {
          setPendingVoiceText(finalText);
          setInputDisplayText(finalText);
        }
      }
    };

    return () => { 
      voiceSetupRef.current = false;
      try { if (show) show.remove(); } catch (_) {}
      try { if (hide) hide.remove(); } catch (_) {}
      try { Voice.destroy().then(Voice.removeAllListeners); } catch (_) {}
      try { Speech.stop(); } catch (_) {}
    };
  }, [trigger]);

  const handleSend = useCallback(async () => {
    const text = (inputText || inputDisplayText).trim();
    if (!text || isTyping) return;
    trigger('light');
    setInputText('');
    setInputDisplayText('');
    setPendingVoiceText(null);
    await sendMessage(text);
  }, [inputText, inputDisplayText, isTyping, trigger, sendMessage]);

  const toggleListening = useCallback(async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        setPartialResults([]);
        setInputDisplayText('');
      } else {
        trigger('light');
        try { Speech.stop(); } catch (_) {}
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setPartialResults([]);
        setPendingVoiceText(null);
        setInputDisplayText('');
        await Voice.start('en-IN');
      }
    } catch (e) {
      console.error('Voice Toggle Error:', e);
      Alert.alert('Microphone Error', 'Could not start voice recognition. Please ensure permissions are granted.');
    }
  }, [isListening, trigger]);

  const handleSpeakMessage = useCallback((msgId: string, text: string) => {
    trigger('light');
    if (speakingMessageId === msgId) {
      stopSpeaking();
    } else {
      stopSpeaking();
      setSpeakingMessageId(msgId);
      speak(text);
    }
  }, [speakingMessageId, trigger, stopSpeaking, speak]);

  const handleCopy = () => {
    trigger('light');
    Alert.alert('Copied', 'Response copied to clipboard');
  };

  const handleQuickAction = (label: string) => {
    trigger('light');
    setInputText(label);
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  const activeAccount = useMemo(
    () => accounts.find((account) => account.isActive) ?? accounts[0],
    [accounts]
  );
  const welcomeName = useMemo(() => {
    if (!userId) return 'back';
    const cleanName = userId.replace(/\d+/g, '').trim();
    return cleanName || 'back';
  }, [userId]);
  const canUseAssistant = modelReady && !isDownloading && isNativeAvailable;

  const handlePromptPress = useCallback(async (prompt: string) => {
    trigger('light');
    if (isTyping) return;

    if (canUseAssistant) {
      setInputText('');
      await sendMessage(prompt);
      return;
    }

    setInputText(prompt);
  }, [canUseAssistant, isTyping, sendMessage, trigger]);

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT * 0.88,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(10, 10, 20, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      borderTopWidth: 1,
      borderColor: Colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderColor: Colors.border,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.success + '20',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      gap: 4,
    },
    headerBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.success,
    },
    headerBadgeText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 10,
      color: Colors.success,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnActive: {
      backgroundColor: Colors.accentBlue + '20',
      borderWidth: 1,
      borderColor: Colors.accentBlue + '40',
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatContainer: {
      flex: 1,
    },
    messagesList: {
      padding: Spacing.lg,
      paddingBottom: Spacing['3xl'],
    },
    messageWrapper: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
      alignItems: 'flex-end',
    },
    userMessageWrapper: {
      justifyContent: 'flex-end',
    },
    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.accentBlue + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    messageBubble: {
      maxWidth: SCREEN_WIDTH * 0.75,
      padding: Spacing.md,
      borderRadius: 20,
    },
    userBubble: {
      backgroundColor: Colors.accentBlue,
      borderBottomRightRadius: 6,
    },
    botBubble: {
      backgroundColor: Colors.cardSurface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderBottomLeftRadius: 6,
    },
    messageText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      lineHeight: 24,
    },
    userText: {
      color: '#fff',
    },
    botText: {
      color: Colors.textPrimary,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    userMessageFooter: {
      justifyContent: 'flex-end',
    },
    timestamp: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 9,
      color: Colors.textMuted,
    },
    copyButton: {
      padding: 2,
    },
    speakBtn: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    speakBtnActive: {
      backgroundColor: Colors.accentBlue,
      borderColor: Colors.accentBlue,
    },
    thinkingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    thinkingDots: {
      flexDirection: 'row',
      gap: 4,
    },
    thinkingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.accentBlue,
    },
    thinkingText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
      fontStyle: 'italic',
    },
    quickActionsContainer: {
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    quickActionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundTertiary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      gap: 6,
    },
    quickActionText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    suggestionsContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    welcomeContainer: {
      gap: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    heroCard: {
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    heroGradient: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    heroEyebrow: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      letterSpacing: Typography.letterSpacing.widest,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: Spacing.xs,
    },
    heroTitle: {
      fontFamily: Typography.fontFamily.extraBold,
      fontSize: Typography.fontSize.xl,
      lineHeight: 28,
      color: Colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    heroSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      lineHeight: 20,
      color: Colors.textSecondary,
      maxWidth: '96%',
    },
    heroOrb: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    heroBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    heroInfoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    heroInfoText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.textPrimary,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    statCard: {
      width: '47.5%',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.cardSurface,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 6,
    },
    statIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundTertiary,
    },
    statLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: Typography.letterSpacing.wide,
    },
    statValue: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textPrimary,
    },
    statSubtext: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      color: Colors.textSecondary,
    },
    sectionLabel: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    starterCard: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.cardSurface,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.sm,
      gap: 4,
    },
    starterTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    starterTitle: {
      flex: 1,
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.sm,
      lineHeight: 18,
      color: Colors.textPrimary,
    },
    starterSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      lineHeight: 16,
      color: Colors.textSecondary,
    },
    starterArrow: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.accentBlueSoft,
    },
    suggestionPill: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.accentBlue + '15',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.accentBlue + '30',
    },
    suggestionText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.accentBlue,
    },
    inputArea: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
      backgroundColor: Colors.cardSurface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      gap: Spacing.sm,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundTertiary,
      borderRadius: 24,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      minHeight: 44,
    },
    inputContainerActive: {
      borderColor: Colors.accentBlue,
    },
    input: {
      flex: 1,
      minHeight: 24,
      maxHeight: 44,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      paddingVertical: 0,
    },
    voiceButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceButtonDisabled: {
      opacity: 0.4,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: Colors.backgroundTertiary,
    },
    initializingContainer: {
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    loadingText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textMuted,
      marginTop: Spacing.md,
    },
    downloadContainer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.cardSurface,
    },
    downloadCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
    },
    downloadTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    downloadSub: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    primaryDownloadBtn: {
      backgroundColor: Colors.accentBlue,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      width: '100%',
      alignItems: 'center',
    },
    primaryDownloadBtnText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      color: '#fff',
    },
    progressBarBg: {
      width: '100%',
      height: 6,
      backgroundColor: Colors.backgroundTertiary,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: Colors.accentCyan,
      borderRadius: 3,
    },
    downloadFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    progressText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: Colors.textMuted,
    },
    controlBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    controlBtnText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.sm,
      color: Colors.textPrimary,
    },
    downloadControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.md,
      gap: Spacing.md,
    },
    cancelActionBtn: {
      borderColor: Colors.error + '30',
    },
    listeningOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? 'rgba(10, 10, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      zIndex: 1000,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    listeningCircle: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    listeningMicContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
      shadowColor: '#2E5BFF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    listeningText: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      marginBottom: Spacing.xs,
    },
    listeningSub: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      textAlign: 'center',
    },
  }), [Colors, isDark]);

  if (!isVisible && !isSheetMounted) return null;

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View 
        style={[
          styles.sheet, 
          { 
            transform: [{ translateY: slideAnim }],
            paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 
          }
        ]}
      >
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Sparkles size={20} color={Colors.accentBlue} />
            <Text style={styles.headerTitle}>Luxe-Bot</Text>
            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>AI Powered</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {messages.length > 1 && (
              <Pressable style={styles.actionBtn} onPress={() => { trigger('light'); clearChat(); }}>
                <Trash2 size={16} color={Colors.textMuted} />
              </Pressable>
            )}
            {isTyping && (
              <Pressable style={styles.actionBtn} onPress={() => { trigger('light'); cancelGeneration(); }}>
                <Square size={14} color={Colors.error} />
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.chatContainer}>
          {isListening && <ListeningPulse Colors={Colors} styles={styles} />}
          
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isBot = !isUser && msg.text && !msg.isStreaming;
              const isCurrentlySpeaking = speakingMessageId === msg.id;
              return (
                <View key={msg.id} style={[styles.messageWrapper, isUser && styles.userMessageWrapper]}>
                  {!isUser && (
                    <View style={styles.botAvatar}>
                      <Sparkles size={14} color={Colors.accentBlue} />
                    </View>
                  )}
                  
                  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                    {msg.isStreaming && !msg.text ? (
                      <ThinkingIndicator styles={styles} />
                    ) : msg.text ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                          {msg.text}
                        </Text>
                        {msg.isStreaming && <CursorBlink />}
                      </View>
                    ) : null}
                  </View>

                  {!isUser && isBot && (
                    <Pressable
                      style={[styles.speakBtn, isCurrentlySpeaking && styles.speakBtnActive]}
                      onPress={() => handleSpeakMessage(msg.id, msg.text)}
                    >
                      {isCurrentlySpeaking ? (
                        <Square size={10} color="#fff" fill="#fff" />
                      ) : (
                        <Volume2 size={14} color={isCurrentlySpeaking ? '#fff' : Colors.textSecondary} />
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}

            {isInitializing && (
              <View style={styles.initializingContainer}>
                <ActivityIndicator color={Colors.accentBlue} />
                <Text style={styles.loadingText}>Initializing neural engine...</Text>
              </View>
            )}

            {messages.length === 0 && !isInitializing && (
              <View style={styles.welcomeContainer}>
                <View style={styles.heroCard}>
                  <LinearGradient
                    colors={isDark ? ['rgba(46, 91, 255, 0.22)', 'rgba(0, 212, 255, 0.08)', 'rgba(10, 10, 20, 0.96)'] : ['rgba(46, 91, 255, 0.14)', 'rgba(0, 212, 255, 0.06)', 'rgba(255, 255, 255, 0.96)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradient}
                  >
                    <View style={styles.heroTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.heroEyebrow}>{getGreeting()}</Text>
                        <Text style={styles.heroTitle}>Welcome {welcomeName}. Meet Kairo AI, your private finance assistant.</Text>
                        <Text style={styles.heroSubtitle}>
                          Ask for spending insights, smarter transfers, portfolio context, or a clean summary before your next move.
                        </Text>
                      </View>
                      <View style={styles.heroOrb}>
                        <Sparkles size={24} color={Colors.accentCyan} />
                      </View>
                    </View>

                    <View style={styles.heroBadgeRow}>
                      <View style={styles.heroInfoPill}>
                        <Shield size={14} color={Colors.success} />
                        <Text style={styles.heroInfoText}>Private on-device AI</Text>
                      </View>
                      <View style={styles.heroInfoPill}>
                        <Mic size={14} color={Colors.accentCyan} />
                        <Text style={styles.heroInfoText}>Voice ready</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View>
                  <Text style={styles.sectionLabel}>Today at a glance</Text>
                  <View style={styles.statGrid}>
                    <View style={styles.statCard}>
                      <View style={styles.statIconWrap}>
                        <Wallet size={18} color={Colors.accentBlue} />
                      </View>
                      <Text style={styles.statLabel}>Total balance</Text>
                      <Text style={styles.statValue}>{formatCurrency(totalBalance)}</Text>
                      <Text style={styles.statSubtext}>{accounts.length} active money buckets</Text>
                    </View>

                    <View style={styles.statCard}>
                      <View style={styles.statIconWrap}>
                        <TrendingUp size={18} color={Colors.success} />
                      </View>
                      <Text style={styles.statLabel}>Portfolio</Text>
                      <Text style={styles.statValue}>{formatCurrency(accountDetails.monthlyInterest)}</Text>
                      <Text style={styles.statSubtext}>Passive growth this month</Text>
                    </View>

                    <View style={styles.statCard}>
                      <View style={styles.statIconWrap}>
                        <Sparkles size={18} color={Colors.gold} />
                      </View>
                      <Text style={styles.statLabel}>Rewards</Text>
                      <Text style={styles.statValue}>{accountDetails.rewardPoints.toLocaleString()}</Text>
                      <Text style={styles.statSubtext}>Points ready to be optimized</Text>
                    </View>

                    <View style={styles.statCard}>
                      <View style={styles.statIconWrap}>
                        <Shield size={18} color={Colors.accentCyan} />
                      </View>
                      <Text style={styles.statLabel}>Focused account</Text>
                      <Text style={styles.statValue}>{activeAccount?.name ?? 'Primary account'}</Text>
                      <Text style={styles.statSubtext}>{formatCurrency(activeAccount?.balance ?? 0)}</Text>
                    </View>
                  </View>
                </View>

                {canUseAssistant && (
                  <View>
                    <Text style={styles.sectionLabel}>Suggested questions</Text>
                    {STARTER_PROMPTS.map((prompt) => (
                      <Pressable
                        key={prompt.id}
                        style={styles.starterCard}
                        onPress={() => handlePromptPress(prompt.title)}
                      >
                        <View style={styles.starterTitleRow}>
                          <Text style={styles.starterTitle}>{prompt.title}</Text>
                          <View style={styles.starterArrow}>
                            <ArrowRight size={16} color={Colors.accentBlue} />
                          </View>
                        </View>
                        <Text style={styles.starterSubtitle}>{prompt.subtitle}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {messages.length > 0 && !isTyping && (
            <View style={styles.quickActionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsRow}
                keyboardShouldPersistTaps="handled"
              >
                {QUICK_ACTIONS.map((action) => (
                  <Pressable 
                    key={action.id}
                    style={styles.quickActionChip}
                    onPress={() => handleQuickAction(action.label)}
                  >
                    <Text style={{ fontSize: 16 }}>{action.icon}</Text>
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {messages.length === 0 && !isInitializing && (!modelReady || isDownloading || !isNativeAvailable) && (
            <View style={styles.downloadContainer}>
              {!isNativeAvailable && (
                <LinearGradient colors={['rgba(255, 77, 109, 0.1)', 'transparent']} style={styles.downloadCard}>
                  <Lock size={28} color={Colors.error} />
                  <Text style={[styles.downloadTitle, { color: Colors.error }]}>Standalone App Required</Text>
                  <Text style={styles.downloadSub}>
                    Run the Kairo app directly for full AI capabilities.
                  </Text>
                </LinearGradient>
              )}

              {isNativeAvailable && !modelExists && !isDownloading && (
                <LinearGradient colors={[Colors.accentBlue + '15', 'transparent']} style={styles.downloadCard}>
                  <Sparkles size={28} color={Colors.accentBlue} />
                  <Text style={styles.downloadTitle}>Download AI Engine</Text>
                  <Text style={styles.downloadSub}>
                    2GB local model for private, offline AI assistance.
                  </Text>
                  <Pressable style={styles.primaryDownloadBtn} onPress={handleDownload}>
                    <Text style={styles.primaryDownloadBtnText}>Download (2.0 GB)</Text>
                  </Pressable>
                </LinearGradient>
              )}

              {isDownloading && (
                <LinearGradient colors={[Colors.accentBlue + '10', 'transparent']} style={styles.downloadCard}>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
                  </View>
                  <View style={styles.downloadFooter}>
                    <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
                    <Text style={styles.progressText}>{(downloadedSize / (1024 * 1024 * 1024)).toFixed(1)} GB / {(totalSize / (1024 * 1024 * 1024)).toFixed(1)} GB</Text>
                  </View>
                  <View style={styles.downloadControls}>
                    <Pressable style={styles.controlBtn} onPress={isPaused ? resumeDownload : pauseDownload}>
                      <Text style={styles.controlBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                    </Pressable>
                    <Pressable style={[styles.controlBtn, styles.cancelActionBtn]} onPress={cancelDownload}>
                      <Text style={[styles.controlBtnText, { color: Colors.error }]}>Cancel</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              )}
            </View>
          )}

          <View style={[
            styles.inputArea, 
            isKeyboardVisible && { paddingBottom: 0 }
          ]}>
            <View style={[styles.inputContainer, isInputFocused && styles.inputContainerActive]}>
              <TextInput
                style={styles.input}
                placeholder={isListening ? "Listening..." : "Ask about your finances..."}
                placeholderTextColor={Colors.textMuted}
                value={isListening ? inputDisplayText : (inputText || inputDisplayText)}
                onChangeText={(text) => { setInputText(text); setInputDisplayText(''); }}
                multiline={false}
                blurOnSubmit={true}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                maxLength={300}
                editable={modelReady && !isDownloading}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <Pressable 
                style={[styles.voiceButton, !canUseAssistant && styles.voiceButtonDisabled]}
                onPress={toggleListening}
                disabled={!canUseAssistant}
              >
                {isListening ? (
                  <MicOff size={18} color={Colors.accentBlue} />
                ) : (
                  <Mic size={18} color={canUseAssistant ? Colors.textMuted : Colors.textTertiary} />
                )}
              </Pressable>
            </View>
            <Pressable 
              style={[styles.sendButton, (!inputText.trim() || isTyping || !modelReady) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping || !modelReady}
            >
              <ArrowUp size={20} color={inputText.trim() ? '#fff' : Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};
