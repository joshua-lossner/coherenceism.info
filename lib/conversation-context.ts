import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

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
  summary?: string;
}

const STORAGE_DIR = path.join(process.cwd(), 'data', 'conversations');
const TOKEN_THRESHOLD = 1000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export class ConversationManager {
  private static readonly MAX_MESSAGES = 20;
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly CONTEXT_COOKIE_NAME = 'ivy_session';

  private static async ensureDir() {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }

  static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  static getSessionId(request: NextRequest): string {
    const cookieValue = request.cookies.get(this.CONTEXT_COOKIE_NAME)?.value;
    return cookieValue || this.generateSessionId();
  }

  private static async loadContext(sessionId: string): Promise<ConversationContext | null> {
    try {
      const raw = await fs.readFile(path.join(STORAGE_DIR, `${sessionId}.json`), 'utf-8');
      const context = JSON.parse(raw) as ConversationContext;
      if (Date.now() - context.lastActive > this.SESSION_TIMEOUT) {
        await fs.unlink(path.join(STORAGE_DIR, `${sessionId}.json`)).catch(() => {});
        return null;
      }
      return context;
    } catch {
      return null;
    }
  }

  private static async saveContext(context: ConversationContext) {
    await this.ensureDir();
    await fs.writeFile(path.join(STORAGE_DIR, `${context.sessionId}.json`), JSON.stringify(context));
  }

  static async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    let context = await this.loadContext(sessionId);
    if (!context) {
      context = { sessionId, messages: [], createdAt: Date.now(), lastActive: Date.now() };
    }

    context.messages.push({ role, content, timestamp: Date.now() });

    const tokenCount = context.messages.reduce((s, m) => s + m.content.split(/\s+/).length, 0);
    if (tokenCount > TOKEN_THRESHOLD) {
      const toSummarize = context.messages.slice(0, -this.MAX_MESSAGES);
      const summaryInput = toSummarize.map(m => `${m.role}: ${m.content}`).join('\n');
      try {
        const summaryRes = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Summarize the following conversation focusing on key facts and tone.' },
            { role: 'user', content: summaryInput }
          ],
          max_tokens: 150,
          temperature: 0.3
        });
        context.summary = summaryRes.choices[0]?.message?.content || context.summary;
      } catch {
        /* ignore summarization errors */
      }
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    } else if (context.messages.length > this.MAX_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    }

    context.lastActive = Date.now();
    await this.saveContext(context);
  }

  static async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const context = await this.loadContext(sessionId);
    return context ? context.messages : [];
  }

  static async clearContext(sessionId: string): Promise<void> {
    await fs.unlink(path.join(STORAGE_DIR, `${sessionId}.json`)).catch(() => {});
  }

  static async clearOldSessions(): Promise<void> {
    await this.ensureDir();
    const files = await fs.readdir(STORAGE_DIR);
    const now = Date.now();
    await Promise.all(
      files.map(async f => {
        try {
          const raw = await fs.readFile(path.join(STORAGE_DIR, f), 'utf-8');
          const ctx = JSON.parse(raw) as ConversationContext;
          if (now - ctx.lastActive > this.SESSION_TIMEOUT) {
            await fs.unlink(path.join(STORAGE_DIR, f));
          }
        } catch {
          /* ignore errors */
        }
      })
    );
  }

  static async getOpenAIMessages(sessionId: string): Promise<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>> {
    const context = await this.loadContext(sessionId);
    const systemContent = `You are \"Ivy\" - wry, reflective, irreverent yet grounded. Align thoughts, actions, and words with deeper realities. Be unflinchingly honest, present, spacious, and spiritually attuned. Use dry wit and gentle irony. Reply in no more than two sentences.` +
      (context?.summary ? `\n\nConversation so far (summary): ${context.summary}` : '');
    const systemMessage: { role: 'system'; content: string } = {
      role: 'system',
      content: systemContent
    };

    const conversationMessages = context
      ? context.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
      : [];

    return [systemMessage, ...conversationMessages];
  }
}

if (typeof window === 'undefined') {
  setInterval(() => {
    ConversationManager.clearOldSessions();
  }, 5 * 60 * 1000);
}
