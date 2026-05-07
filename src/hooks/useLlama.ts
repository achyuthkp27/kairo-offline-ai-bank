/**
 * Kairo — useLlama Hook
 * React hook for managing chat state and streaming logic with the local AI engine
 */

import { useState, useCallback, useEffect } from 'react';
import { llamaEngine } from '../ai/llamaEngine';
import { checkModelExists, downloadModel, deleteModel } from '../ai/modelManager';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../store/chatStore';

export type { ChatMessage } from '../store/chatStore';

export const useLlama = (onAction?: (action: any) => void) => {
  const { messages, setMessages } = useChatStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize model on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      let initialized = false;

      while (!initialized && mounted) {
        try {
          const exists = await checkModelExists();
          if (!exists) {
            if (mounted) setIsDownloading(true);
            await downloadModel((progress) => {
              if (mounted) setDownloadProgress(progress);
            });
            if (mounted) setIsDownloading(false);
          }
          
          // initializeModel is idempotent — if TabLayout already started it, this is instant
          await llamaEngine.initializeModel();
          
          // Wait for warmup (KV cache + DB pre-cache) to finish
          await llamaEngine.waitUntilReady();
          
          initialized = true;
          
          if (mounted) {
            setIsInitializing(false);
            setMessages((prev: ChatMessage[]) => {
              if (prev.length === 0) {
                return [
                  {
                    id: 'welcome',
                    text: 'Good evening. I am Kairo, your private financial concierge. How may I assist you today?',
                    sender: 'bot',
                  },
                ];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Failed to initialize AI, retrying:', error);
          if (mounted) {
            setIsDownloading(false);
            await deleteModel();
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }
    };
    init();

    return () => {
      mounted = false;
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

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
            
            // Strip any leaked internal prompt tags from the model output
            finalText = finalText
              .replace(/\[USER_CONTEXT\]:?[^\n]*/gi, '')
              .replace(/\[LIVE_DATA(?:_INJECT)?\]:?[^\n]*/gi, '')
              .replace(/\[RAG(?:_CONTEXT)?\]:?[^\n]*/gi, '')
              .replace(/\[CONTEXT\]:?[^\n]*/gi, '')
              .replace(/<\|im_start\|>[^\n]*/g, '')
              .replace(/<\|im_end\|>/g, '')
              .trim();
            
            // Try matching markdown JSON block first
            let actionMatch = finalText.match(/```(?:json)?\n([\s\S]*?)\n```/);
            let jsonString = actionMatch ? actionMatch[1] : null;
            let replaceRegex: RegExp = /```(?:json)?\n[\s\S]*?\n```/;

            // Fallback: If no markdown block, check if it just ended with a raw JSON object containing "action"
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
                
                // If the model's entire response was just the JSON block, show a fallback message
                if (!finalText && actionData) {
                  if (actionData.action === 'navigate') {
                    finalText = `Taking you to ${actionData.details || 'the requested page'}...`;
                  } else {
                    finalText = `Executing: ${actionData.action}`;
                  }
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
  }, [isTyping, messages]);

  return {
    messages,
    isInitializing,
    isTyping,
    isDownloading,
    downloadProgress,
    sendMessage,
  };
};
