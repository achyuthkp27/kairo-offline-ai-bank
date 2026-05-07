/**
 * Kairo — Background Memory Extraction Worker
 * Analyzes chat history post-conversation to extract persistent user preferences
 */

import { llamaEngine } from '../ai/llamaEngine';
import { MemoryService } from '../services/MemoryService';

export class MemoryWorker {
  /**
   * Run memory extraction in the background. 
   * This should be called *after* a chat session is completed or idle.
   */
  static async extractMemories(chatHistory: { role: 'user' | 'assistant', content: string }[]) {
    // Only analyze the last 4 messages to keep extraction fast
    const recentMessages = chatHistory.slice(-4);
    if (recentMessages.length === 0) return;

    const conversationText = recentMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const extractionPrompt = `<|im_start|>system
You are a memory extraction engine. Analyze the following conversation and extract any new, permanent user preferences, behaviors, or personal facts.
Output ONLY a JSON array of extracted memories. If nothing worth remembering is found, output [].
Format:
[
  {"key": "payment_preference", "value": "User prefers using UPI for payments", "category": "preference"}
]
Valid categories: preference, behavior, persona.
<|im_end|>
<|im_start|>user
Conversation:
${conversationText}
<|im_end|>
<|im_start|>assistant
`;

    try {
      console.log('[MemoryWorker] Running background extraction...');
      
      // Wait for engine to be free (e.g. after user gets response)
      const rawOutput = await llamaEngine.generateOneShot(extractionPrompt, 128);
      
      // Parse JSON from output
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const memories = JSON.parse(jsonMatch[0]);
        for (const mem of memories) {
          if (mem.key && mem.value && mem.category) {
            await MemoryService.saveMemory(mem.key, mem.value, mem.category);
          }
        }
      }
    } catch (e) {
      console.warn('[MemoryWorker] Memory extraction failed:', e);
    }
  }
}
