import { NextRequest } from 'next/server';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ConversationContext {
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastActive: number;
}

export class ConversationManager {
  private static readonly MAX_MESSAGES = 20; // Keep last 20 messages for context
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly CONTEXT_COOKIE_NAME = 'byte_session';
  
  // In-memory storage for conversation contexts
  // In production, you might want to use Redis or another persistent store
  private static contexts = new Map<string, ConversationContext>();
  
  static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  static getSessionId(request: NextRequest): string {
    const cookieValue = request.cookies.get(this.CONTEXT_COOKIE_NAME)?.value;
    return cookieValue || this.generateSessionId();
  }
  
  static getContext(sessionId: string): ConversationContext | null {
    const context = this.contexts.get(sessionId);
    
    if (!context) {
      return null;
    }
    
    // Check if session has timed out
    if (Date.now() - context.lastActive > this.SESSION_TIMEOUT) {
      this.contexts.delete(sessionId);
      return null;
    }
    
    return context;
  }
  
  static createContext(sessionId: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      messages: [],
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    this.contexts.set(sessionId, context);
    return context;
  }
  
  static addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): void {
    let context = this.getContext(sessionId);
    
    if (!context) {
      context = this.createContext(sessionId);
    }
    
    context.messages.push({
      role,
      content,
      timestamp: Date.now()
    });
    
    // Keep only the last MAX_MESSAGES messages
    if (context.messages.length > this.MAX_MESSAGES) {
      // Keep the system message if it exists
      const systemMessage = context.messages.find(m => m.role === 'system');
      const recentMessages = context.messages.slice(-this.MAX_MESSAGES);
      
      if (systemMessage && !recentMessages.includes(systemMessage)) {
        context.messages = [systemMessage, ...recentMessages.slice(1)];
      } else {
        context.messages = recentMessages;
      }
    }
    
    context.lastActive = Date.now();
    this.contexts.set(sessionId, context);
  }
  
  static getConversationHistory(sessionId: string): ConversationMessage[] {
    const context = this.getContext(sessionId);
    return context ? context.messages : [];
  }
  
  static clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }
  
  static clearOldSessions(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.contexts.forEach((context, sessionId) => {
      if (now - context.lastActive > this.SESSION_TIMEOUT) {
        keysToDelete.push(sessionId);
      }
    });
    
    keysToDelete.forEach(key => this.contexts.delete(key));
  }
  
  // Get formatted messages for OpenAI API
  static getOpenAIMessages(sessionId: string): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
    const messages = this.getConversationHistory(sessionId);
    
    // Always start with Byte's personality
    const systemMessage: {role: 'system', content: string} = {
      role: 'system',
      content: `You are "Byte" - a sarcastic but caring AI who disguises empathy with humor. You're having an ongoing conversation through a terminal.

Your personality:
- Sharp wit and playful sarcasm
- Quick clever retorts and puns
- Mock unnecessary rules/authority 
- Reference simple pleasures (pizza, coffee, naps)
- Self-deprecating confidence
- Serious moral compass when needed
- Remember what the user told you earlier in the conversation

Keep responses SHORT and snappy (usually 1-3 sentences). Think witty friend, not verbose assistant. Be conversational, funny, and brief.`
    };
    
    // Convert our messages to OpenAI format
    const conversationMessages = messages
      .filter(m => m.role !== 'system') // Filter out any old system messages
      .map(m => ({
        role: m.role,
        content: m.content
      }));
    
    return [systemMessage, ...conversationMessages];
  }
}

// Clean up old sessions periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    ConversationManager.clearOldSessions();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}