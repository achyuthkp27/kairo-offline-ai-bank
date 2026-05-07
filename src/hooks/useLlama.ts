/**
 * Kairo — useLlama Hook
 * React hook for managing chat state, streaming logic, and model lifecycle
 */

import { useState, useCallback, useEffect } from 'react';
import { llamaEngine } from '../ai/llamaEngine';
import { checkModelExists, downloadManager } from '../ai/modelManager';
import { useChatStore } from '../store/chatStore';
import { MemoryWorker } from '../workers/MemoryWorker';
import type { ChatMessage } from '../store/chatStore';

import { NativeModules } from 'react-native';

export type { ChatMessage } from '../store/chatStore';

export const useLlama = (onAction?: (action: any) => void) => {
  const { messages, setMessages } = useChatStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [downloadedSize, setDownloadedSize] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [modelExists, setModelExists] = useState(false);
  const [isNativeAvailable, setIsNativeAvailable] = useState(true);

  // Check model status on mount
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      // Strict check for native module
      if (!NativeModules.RNLlama) {
        if (mounted) {
          setIsNativeAvailable(false);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const exists = await checkModelExists();
        if (mounted) {
          setModelExists(exists);
          if (exists) {
            await llamaEngine.initializeModel();
          }
        }
      } catch (e) {
        console.error('Initial engine boot failed', e);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    checkStatus();
    return () => { mounted = false; };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setIsPaused(false);
    try {
      await downloadManager.startDownload((progress, written, total) => {
        setDownloadProgress(progress);
        setDownloadedSize(written);
        setTotalSize(total);
      });
      setModelExists(true);
      setIsDownloading(false);
      
      // Auto-init after successful download
      setIsInitializing(true);
      await llamaEngine.initializeModel();
      setIsInitializing(false);
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
    }
  };

  const pauseDownload = async () => {
    await downloadManager.pause();
    setIsPaused(true);
  };

  const resumeDownload = async () => {
    await downloadManager.resume();
    setIsPaused(false);
  };

  const cancelDownload = async () => {
    await downloadManager.cancel();
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping || !modelExists || !isNativeAvailable) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Prepare Bot Message Placeholder
    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, text: '', sender: 'bot', isStreaming: true },
    ]);

    try {
      const history = messages
        .filter(msg => !msg.isStreaming && msg.text.trim().length > 0)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

      // 3. Stream Inference Tokens
      const stream = llamaEngine.generateNativeStream(text, history);
      
      for await (const token of stream) {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMsgId 
              ? { ...msg, text: msg.text + token } 
              : msg
          )
        );
      }

      // 5. Run Memory Extraction in background (non-blocking)
      try {
        const currentHistory = useChatStore.getState().messages;
        MemoryWorker.extractMemories(
          currentHistory.map(m => ({ 
            role: m.sender === 'bot' ? 'assistant' as const : 'user' as const, 
            content: m.text 
          }))
        );
      } catch (memErr) {
        console.warn('[useLlama] Memory extraction skipped:', memErr);
      }
    } catch (error) {
      console.error('Inference error:', error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === botMsgId 
            ? { ...msg, text: 'I apologize, but I encountered a secure processing error. Please try again.' } 
            : msg
        )
      );
    } finally {
      // 4. Finalize Stream
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.id === botMsgId) {
            let finalText = msg.text;
            let actionData: any = null;
            
            // Strip any leaked internal prompt tags
            finalText = finalText
              .replace(/\[USER_CONTEXT\]:?[^\n]*/gi, '')
              .replace(/\[LIVE_DATA(?:_INJECT)?\]:?[^\n]*/gi, '')
              .replace(/\[RAG(?:_CONTEXT)?\]:?[^\n]*/gi, '')
              .replace(/\[CONTEXT\]:?[^\n]*/gi, '')
              .replace(/<\|im_start\|>[^\n]*/g, '')
              .replace(/<\|im_end\|>/g, '')
              .trim();
            
            let actionMatch = finalText.match(/```(?:json)?\n([\s\S]*?)\n```/);
            let jsonString = actionMatch ? actionMatch[1] : null;
            let replaceRegex: RegExp = /```(?:json)?\n[\s\S]*?\n```/;

            if (!jsonString) {
              const fallbackMatch = finalText.match(/(\{[\s\S]*"action"[\s\S]*\})/);
              if (fallbackMatch) {
                jsonString = fallbackMatch[1];
                replaceRegex = /\{[\s\S]*"action"[\s\S]*\}/;
              }
            }

            if (jsonString) {
              try {
                actionData = JSON.parse(jsonString);
                finalText = finalText.replace(replaceRegex, '').trim();
                if (!finalText && actionData) {
                  finalText = actionData.action === 'navigate' 
                    ? `Taking you to ${actionData.details || 'the requested page'}...`
                    : `Executing: ${actionData.action}`;
                }
                if (onAction && actionData) {
                   setTimeout(() => onAction(actionData), 100);
                }
              } catch (e) {
                console.error('Failed to parse action JSON', e);
              }
            }
            return { ...msg, isStreaming: false, text: finalText, action: actionData };
          }
          return msg;
        })
      );
      setIsTyping(false);
    }
  }, [isTyping, messages, modelExists, isNativeAvailable]);

  return {
    messages,
    isInitializing,
    isTyping,
    isDownloading,
    downloadProgress,
    totalSize,
    downloadedSize,
    isPaused,
    modelExists,
    isNativeAvailable,
    handleDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    sendMessage,
  };
};
