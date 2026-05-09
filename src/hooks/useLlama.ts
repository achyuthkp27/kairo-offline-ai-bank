import { useState, useCallback, useEffect, useRef } from 'react';
import { llamaEngine } from '../ai/llamaEngine';
import { checkModelExists, downloadManager, deleteModel } from '../ai/modelManager';
import { useChatStore, type AIAction, type AIActionType } from '../store/chatStore';
import { MemoryWorker } from '../workers/MemoryWorker';
import type { ChatMessage } from '../store/chatStore';

import { NativeModules } from 'react-native';

export type { ChatMessage } from '../store/chatStore';

const STREAM_BATCH_INTERVAL = 50;

export const useLlama = (onAction?: (action: AIAction) => void) => {
  const { messages, setMessages, clearChat } = useChatStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [downloadedSize, setDownloadedSize] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [modelExists, setModelExists] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isNativeAvailable, setIsNativeAvailable] = useState(true);

  const isTypingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      llamaEngine.cancelGeneration();
      llamaEngine.unloadModel();
      clearChat();
    };
  }, [clearChat]);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
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
            const loaded = await llamaEngine.initializeModel();
            if (mounted) {
              setModelReady(loaded);
              if (!loaded) {
                setInitError('Model file exists but failed to load. It may be corrupted.');
              }
            }
          }
        }
      } catch (e) {
        console.error('[useLlama] Initial engine boot failed', e);
        if (mounted) {
          setModelReady(false);
          setInitError(`Engine boot error: ${e instanceof Error ? e.message : String(e)}`);
        }
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
    setInitError(null);
    try {
      await downloadManager.startDownload((progress, written, total) => {
        if (mountedRef.current) {
          setDownloadProgress(progress);
          setDownloadedSize(written);
          setTotalSize(total);
        }
      });
      if (!mountedRef.current) return;
      setModelExists(true);
      setIsDownloading(false);

      setIsInitializing(true);
      const loaded = await llamaEngine.initializeModel();
      if (mountedRef.current) {
        setModelReady(loaded);
        if (!loaded) {
          setInitError('Model downloaded but failed to initialize. It may be corrupted.');
        }
        setIsInitializing(false);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setModelExists(false);
      setModelReady(false);
      setIsDownloading(false);
    }
  };

  const cancelGeneration = useCallback(() => {
    llamaEngine.cancelGeneration();
  }, []);

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
    if (!text.trim() || isTypingRef.current || !modelReady || !isNativeAvailable) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      text: text.trim(),
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMsg]);
    isTypingRef.current = true;
    setIsTyping(true);

    const botMsgId = `${Date.now() + 1}_${Math.random().toString(36).substring(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, text: '', sender: 'assistant', isStreaming: true },
    ]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const currentMsgs = useChatStore.getState().messages;
      const history = currentMsgs
        .filter(msg => msg.sender !== 'user' || (msg.id !== userMsg.id && msg.text.trim().length > 0))
        .filter(msg => !msg.isStreaming && msg.text.trim().length > 0)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

      const stream = llamaEngine.generateNativeStream(text, history, abortController.signal);

      let batchedText = '';
      let lastBatchUpdate = Date.now();

      for await (const token of stream) {
        if (abortController.signal.aborted) break;
        batchedText += token;

        const now = Date.now();
        if (now - lastBatchUpdate >= STREAM_BATCH_INTERVAL && batchedText.length > 0) {
          const delta = batchedText;
          batchedText = '';
          lastBatchUpdate = now;
          if (!delta) continue;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, text: msg.text + delta }
                : msg
            )
          );
        }
      }

      if (batchedText.length > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: msg.text + batchedText }
              : msg
          )
        );
      }

      const currentHistory = useChatStore.getState().messages;
      MemoryWorker.extractMemories(
        currentHistory.map(m => ({
          role: m.sender === 'assistant' ? 'assistant' as const : 'user' as const,
          content: m.text
        }))
      ).catch((e) => console.warn('[useLlama] Memory extraction failed:', e));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === 'Generation cancelled') return;
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: msg.text || 'I apologize, but I encountered a processing error. Please try again.' }
            : msg
        )
      );
    } finally {
      abortRef.current = null;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === botMsgId) {
            let finalText = msg.text;

            finalText = finalText
              .replace(/\[USER_CONTEXT\]:?[^\n]*/gi, '')
              .replace(/\[LIVE_DATA(?:_INJECT)?\]:?[^\n]*/gi, '')
              .replace(/\[RAG(?:_CONTEXT)?\]:?[^\n]*/gi, '')
              .replace(/\[CONTEXT\]:?[^\n]*/gi, '')
              .replace(/<\|im_start\|>[^\n]*/g, '')
              .replace(/<\|im_end\|>/g, '')
              .trim();

            let actionData: AIAction | null = null;
            let actionMatch = finalText.match(/```(?:json)?\n([\s\S]*?)\n```/);
            let jsonString = actionMatch ? actionMatch[1] : null;
            let replaceRegex: RegExp = /```(?:json)?\n[\s\S]*?\n```/;

            if (!jsonString) {
              const limitedText = finalText.slice(-500);
              const fallbackMatch = limitedText.match(/(\{[^}]*"action"[^}]*\})/);
              if (fallbackMatch) {
                jsonString = fallbackMatch[1];
                replaceRegex = /\{[^}]*"action"[^}]*\}/;
              }
            }

            if (jsonString) {
              try {
                const parsedAction = JSON.parse(jsonString);
                if (parsedAction.action) {
                  actionData = {
                    action: parsedAction.action as AIAction['action'],
                    details: parsedAction.details,
                  };
                  finalText = finalText.replace(replaceRegex, '').trim();
                  if (!finalText && actionData) {
                    finalText = actionData.action === 'navigate'
                      ? `Taking you to ${actionData.details || 'the requested page'}...`
                      : `Executing: ${actionData.action}`;
                  }
                  if (onAction && actionData) {
                    setTimeout(() => onAction(actionData!), 100);
                  }
                }
              } catch (e) {
                if (__DEV__) console.log('[useLlama] JSON parse failed:', e);
              }
            }
            return { ...msg, isStreaming: false, text: finalText, action: actionData };
          }
          return msg;
        })
      );
      isTypingRef.current = false;
      setIsTyping(false);
    }
  }, [modelReady, isNativeAvailable, onAction]);

  const retryInit = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      await deleteModel();
      setModelExists(false);
      setModelReady(false);
      setIsInitializing(false);
    } catch (e) {
      console.error('[useLlama] retryInit failed:', e);
      setIsInitializing(false);
    }
  }, []);

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
    modelReady,
    initError,
    isNativeAvailable,
    handleDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cancelGeneration,
    sendMessage,
    retryInit,
    clearChat,
  };
};
