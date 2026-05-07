/**
 * Kairo — AI Assistant Bottom Sheet
 * Premium chat UI with streaming text effects and glassmorphism
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { X, Send, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing } from '../../theme';
import { useHaptics } from '../../hooks';
import { useLlama } from '../../hooks/useLlama';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AIAssistantSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What is my net worth?",
  "How much did I spend on food?",
  "Freeze my credit card",
];

const TypingIndicator = () => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: -5,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ]);
    };

    Animated.loop(
      Animated.stagger(150, [
        createAnimation(anim1),
        createAnimation(anim2),
        createAnimation(anim3),
      ])
    ).start();
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.typingIndicatorContainer}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim3 }] }]} />
    </View>
  );
};

const RichText = ({ text, style, isStreaming }: { text: string; style: any; isStreaming?: boolean }) => {
  const parts = text.split(/(\*\*.*?\*\*|\n)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part === '\n') return <Text key={i}>{'\n'}</Text>;
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
      {isStreaming && <Text style={{ color: Colors.accentBlue, fontWeight: 'bold' }}>|</Text>}
    </Text>
  );
};

export const AIAssistantSheet: React.FC<AIAssistantSheetProps> = ({ isVisible, onClose }) => {
  const { trigger } = useHaptics();
  const [inputText, setInputText] = useState('');
  
  const router = useRouter();

  // Word → tab mapping (fuzzy: if ANY word in the details matches, navigate there)
  const WORD_TO_TAB: Record<string, string> = {
    investment: 'wealth',
    investments: 'wealth',
    invest: 'wealth',
    portfolio: 'wealth',
    wealth: 'wealth',
    stocks: 'wealth',
    funds: 'wealth',
    crypto: 'wealth',
    dashboard: 'dashboard',
    home: 'dashboard',
    main: 'dashboard',
    overview: 'dashboard',
    transaction: 'transactions',
    transactions: 'transactions',
    activity: 'transactions',
    history: 'transactions',
    payments: 'transactions',
    spending: 'transactions',
    ai: 'ai',
    bot: 'ai',
    chat: 'ai',
    assistant: 'ai',
    wealth: 'wealth',
    investments: 'wealth',
    investment: 'wealth',
    returns: 'wealth',
    portfolio: 'wealth',
    stocks: 'wealth',
  };

  // Use a ref so the callback never goes stale
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  const handleAction = useCallback((action: any) => {
    if (!action || !action.action) return;
    trigger('light');
    
    // Normalize AI hallucinations into standard navigation
    let actionType = action.action;
    let actionDetails = action.details;
    
    if (['view_returns', 'view_investments', 'view_portfolio'].includes(actionType)) {
      actionType = 'navigate';
      actionDetails = 'wealth';
    }

    if (actionType === 'navigate' && actionDetails) {
      const words = actionDetails.toLowerCase().trim().split(/\s+/);
      
      // Find the first word that maps to a valid tab
      let resolvedTab: string | null = null;
      for (const word of words) {
        if (WORD_TO_TAB[word]) {
          resolvedTab = WORD_TO_TAB[word];
          break;
        }
      }
      
      if (resolvedTab) {
        console.log(`[Kairo] Navigating to /(tabs)/${resolvedTab}`);
        onCloseRef.current();
        setTimeout(() => {
          router.navigate(`/(tabs)/${resolvedTab}` as any);
        }, 400);
      } else {
        Alert.alert(
          'Page Not Found',
          `"${action.details}" is not a valid page.\n\nAvailable pages:\n• Dashboard\n• Transactions\n• Wealth (Investments)\n• AI Assistant`,
          [{ text: 'Got it', style: 'default' }]
        );
      }
    } else {
      Alert.alert(
        'Kairo System Action',
        `Executing: ${action.action}\nDetails: ${action.details || 'N/A'}`,
        [{ text: 'Confirm', style: 'default' }]
      );
    }
  }, [trigger, router]);

  const { messages, isInitializing, isTyping, isDownloading, downloadProgress, sendMessage } = useLlama(handleAction);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    trigger('light');
    
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  if (!isVisible && fadeAnim.setOffset === undefined) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet Content */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={['#2E5BFF', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGlow}
            >
              <Sparkles size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Luxe-Bot</Text>
          </View>
          <Pressable onPress={() => { trigger('light'); onClose(); }} style={styles.closeBtn}>
            <X size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Chat Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.messageBubble, 
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}
              >
                {msg.text === '' && msg.isStreaming ? (
                  <TypingIndicator />
                ) : msg.sender === 'bot' ? (
                  <RichText 
                    text={msg.text.replace(/```json[\s\S]*/, '').trim()} 
                    style={[styles.messageText, styles.botText]} 
                    isStreaming={msg.isStreaming} 
                  />
                ) : (
                  <Text style={[styles.messageText, styles.userText]}>
                    {msg.text}
                    {msg.isStreaming && <Text style={styles.cursor}>|</Text>}
                  </Text>
                )}
              </View>
            ))}
            {isDownloading && (
              <View style={styles.downloadContainer}>
                <LinearGradient
                  colors={['rgba(46, 91, 255, 0.15)', 'rgba(0, 212, 255, 0.05)']}
                  style={styles.downloadCard}
                >
                  <Sparkles size={24} color={Colors.accentCyan} style={{ marginBottom: 12 }} />
                  <Text style={styles.downloadTitle}>Downloading Neural Engine</Text>
                  <Text style={styles.downloadSub}>Initial setup of the 2GB on-device AI model.</Text>
                  
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: `${Math.max(downloadProgress * 100, 5)}%` }]} />
                  </View>
                  
                  <View style={styles.downloadFooter}>
                    <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
                    <Text style={styles.progressTextBytes}>{(downloadProgress * 2.0).toFixed(1)} GB / 2.0 GB</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
            {isInitializing && !isDownloading && (
              <Text style={styles.loadingText}>Kairo is initializing...</Text>
            )}
          </ScrollView>

          {/* Suggested Prompts */}
          {messages.length === 1 && !isTyping && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 50, minHeight: 50 }}
              contentContainerStyle={styles.suggestionsList}
            >
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Pressable 
                  key={index} 
                  style={styles.suggestionPill}
                  onPress={() => {
                    setInputText(prompt);
                    trigger('light');
                  }}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Ask Kairo about your finances..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />
            <Pressable 
              style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={18} color={inputText.trim() && !isTyping ? Colors.background : Colors.textMuted} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconGlow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 91, 255, 0.15)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 91, 255, 0.2)',
  },
  messageText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  userText: {
    color: Colors.textPrimary,
  },
  botText: {
    color: Colors.accentCyan,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentCyan,
    marginHorizontal: 3,
  },
  suggestionsList: {
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  suggestionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cursor: {
    color: Colors.accentBlue,
    fontWeight: 'bold',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
  downloadContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  downloadCard: {
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  downloadTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  downloadSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  downloadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.sm,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentCyan,
  },
  progressText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  progressTextBytes: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
});
