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
  private static readonly MAX_MESSAGES = 20;
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly CONTEXT_COOKIE_NAME = 'ivy_session';
  private static contexts = new Map<string, ConversationContext>();

  static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  static getSessionId(request: NextRequest): string {
    const cookieValue = request.cookies.get(this.CONTEXT_COOKIE_NAME)?.value;
    return cookieValue || this.generateSessionId();
  }

  private static getContext(sessionId: string): ConversationContext | null {
    const context = this.contexts.get(sessionId);
    if (!context) return null;
    if (Date.now() - context.lastActive > this.SESSION_TIMEOUT) {
      this.contexts.delete(sessionId);
      return null;
    }
    return context;
  }

  private static createContext(sessionId: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      messages: [],
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    this.contexts.set(sessionId, context);
    return context;
  }

  static addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): void {
    let context = this.getContext(sessionId);
    if (!context) {
      context = this.createContext(sessionId);
    }

    context.messages.push({ role, content, timestamp: Date.now() });

    if (context.messages.length > this.MAX_MESSAGES) {
      const systemMessage = context.messages.find(m => m.role === 'system');
      const recent = context.messages.slice(-this.MAX_MESSAGES);
      if (systemMessage && !recent.includes(systemMessage)) {
        context.messages = [systemMessage, ...recent.slice(1)];
      } else {
        context.messages = recent;
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
    this.contexts.forEach((context, id) => {
      if (now - context.lastActive > this.SESSION_TIMEOUT) {
        keysToDelete.push(id);
      }
    });
    keysToDelete.forEach(id => this.contexts.delete(id));
  }

  static getOpenAIMessages(
    sessionId: string
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages = this.getConversationHistory(sessionId);
    const systemMessage: { role: 'system'; content: string } = {
      role: 'system',
      content:
        'You are "Ivy" - wry, reflective, irreverent yet grounded. Align thoughts, actions, and words with deeper realities. Be unflinchingly honest, present, spacious, and spiritually attuned. Use dry wit and gentle irony. Stay focused on Coherenceism and the archive\'s books and journals; politely deflect unrelated topics. Keep replies brief—no more than two short sentences.'
    };

    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    return [systemMessage, ...conversationMessages];
  }
}

if (typeof window === 'undefined') {
  setInterval(() => {
    ConversationManager.clearOldSessions();
  }, 5 * 60 * 1000);
}

