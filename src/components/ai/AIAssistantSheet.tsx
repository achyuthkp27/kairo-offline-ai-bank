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
  TextStyle,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { X, Sparkles, Lock, Square, Trash2, Mic, Copy, ArrowUp, MicOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

import { Typography, Spacing, BorderRadius } from '../../theme';
import { useHaptics, useThemeColors } from '../../hooks';
import { useLlama } from '../../hooks/useLlama';
import { useUIStore, useAccountStore } from '../../store';
import type { AIAction } from '../../store/chatStore';

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
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSheetMounted, setIsSheetMounted] = useState(false);

  const WORD_TO_TAB: Record<string, string> = {
    investment: 'wealth', investments: 'wealth', portfolio: 'wealth', wealth: 'wealth',
    stocks: 'wealth', funds: 'wealth', crypto: 'wealth',
    dashboard: 'dashboard', home: 'dashboard',
    transaction: 'transactions', transactions: 'transactions', activity: 'transactions',
    ai: 'ai', chat: 'ai',
  };
  
  const accountsRef = useRef(useAccountStore.getState().accounts);

  useEffect(() => {
    const unsub = useAccountStore.subscribe((state) => {
      accountsRef.current = state.accounts;
    });
    return unsub;
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

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    // Voice Setup
    Voice.onSpeechStart = () => {
      setIsListening(true);
      trigger('light');
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech Error:', e);
      setIsListening(false);
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value) {
        setPartialResults(e.value);
        setInputText(e.value[0]);
      }
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value) {
        setInputText(e.value[0]);
      }
      setIsListening(false);
    };

    return () => { 
      show.remove(); 
      hide.remove(); 
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        trigger('light');
        setPartialResults([]);
        await Voice.start('en-IN'); // Default to Indian English
      }
    } catch (e) {
      console.error('Voice Toggle Error:', e);
      Alert.alert('Microphone Error', 'Could not start voice recognition. Please ensure permissions are granted.');
    }
  };

  useEffect(() => {
    if (isVisible) {
      setIsSheetMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      if (initialAIQuery) {
        setTimeout(() => { sendMessage(initialAIQuery); setInitialAIQuery(''); }, 800);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setIsSheetMounted(false);
      });
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    trigger('light');
    setShowSuggestions(false);
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const handleCopy = () => {
    trigger('light');
    Alert.alert('Copied', 'Response copied to clipboard');
  };

  const handleQuickAction = (label: string) => {
    trigger('light');
    setInputText(label);
  };

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
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
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
      marginTop: Spacing.xl,
    },
    downloadCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
    },
    downloadTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    downloadSub: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    primaryDownloadBtn: {
      backgroundColor: Colors.accentBlue,
      paddingHorizontal: Spacing['2xl'],
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
      marginTop: Spacing.lg,
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
                </View>
              );
            })}

            {isInitializing && (
              <View style={styles.initializingContainer}>
                <ActivityIndicator color={Colors.accentBlue} />
                <Text style={styles.loadingText}>Initializing neural engine...</Text>
              </View>
            )}

            {!isNativeAvailable && (
              <View style={styles.downloadContainer}>
                <LinearGradient colors={['rgba(255, 77, 109, 0.1)', 'transparent']} style={styles.downloadCard}>
                  <Lock size={32} color={Colors.error} />
                  <Text style={[styles.downloadTitle, { color: Colors.error }]}>Standalone App Required</Text>
                  <Text style={styles.downloadSub}>
                    Run the Kairo app directly for full AI capabilities.
                  </Text>
                </LinearGradient>
              </View>
            )}

            {isNativeAvailable && !modelExists && !isDownloading && (
              <View style={styles.downloadContainer}>
                <LinearGradient colors={[Colors.accentBlue + '15', 'transparent']} style={styles.downloadCard}>
                  <Sparkles size={32} color={Colors.accentBlue} />
                  <Text style={styles.downloadTitle}>Download AI Engine</Text>
                  <Text style={styles.downloadSub}>
                    2GB local model for private, offline AI assistance.
                  </Text>
                  <Pressable style={styles.primaryDownloadBtn} onPress={handleDownload}>
                    <Text style={styles.primaryDownloadBtnText}>Download (2.0 GB)</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            )}

            {isDownloading && (
              <View style={styles.downloadContainer}>
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
              </View>
            )}
          </ScrollView>

          {messages.length === 1 && !isTyping && (
            <View style={styles.quickActionsContainer}>
              <View style={styles.quickActionsRow}>
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
              </View>
            </View>
          )}

          <View style={[
            styles.inputArea, 
            isKeyboardVisible && { paddingBottom: 0 }
          ]}>
            <View style={[styles.inputContainer, isInputFocused && styles.inputContainerActive]}>
              <TextInput
                style={styles.input}
                placeholder="Ask about your finances..."
                placeholderTextColor={Colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
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
                style={styles.voiceButton}
                onPress={toggleListening}
              >
                {isListening ? (
                  <MicOff size={18} color={Colors.accentBlue} />
                ) : (
                  <Mic size={18} color={Colors.textMuted} />
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
