/**
 * Shared utility functions for extracting formedible code from messages
 * This ensures DRY principle and consistent behavior between streaming and loading
 */

export interface ExtractedForm {
  id: string;
  code: string;
  timestamp: Date;
}

/**
 * Extracts formedible code from a single message content
 */
export function extractFormedibleCode(content: string): string | null {
  const formedibleMatch = content.match(/```formedible\s*\n([\s\S]*?)\n```/);
  return formedibleMatch && formedibleMatch[1] ? formedibleMatch[1].trim() : null;
}

/**
 * Extracts all forms from conversation messages
 */
export function extractFormsFromMessages(
  messages: Array<{ role: string; content: string }>,
  conversationId?: string,
  baseTimestamp?: Date
): ExtractedForm[] {
  const extractedForms: ExtractedForm[] = [];
  
  messages.forEach((message, messageIndex) => {
    if (message.role === 'assistant' && message.content) {
      const code = extractFormedibleCode(message.content);
      if (code) {
        extractedForms.push({
          id: conversationId 
            ? `form_${conversationId}_${messageIndex}`
            : `form_${Date.now()}_${messageIndex}`,
          code,
          timestamp: baseTimestamp || new Date()
        });
      }
    }
  });
  
  return extractedForms;
}