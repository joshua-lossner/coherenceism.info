interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  private getClientId(request: Request): string {
    // Try to get real IP from various headers (for production behind proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    // Use the first available IP
    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
    
    // Also consider user-agent to make it slightly more unique
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return `${ip}_${userAgent.slice(0, 50)}`;
  }

  check(request: Request, limit: number = 10, windowMs: number = 60000): { allowed: boolean; remaining: number; resetTime: number } {
    const clientId = this.getClientId(request);
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!this.store[clientId] || this.store[clientId].resetTime < now) {
      // First request or window expired
      this.store[clientId] = {
        count: 1,
        resetTime,
      };
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    this.store[clientId].count++;

    if (this.store[clientId].count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[clientId].resetTime,
      };
    }

    return {
      allowed: true,
      remaining: limit - this.store[clientId].count,
      resetTime: this.store[clientId].resetTime,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();

// Rate limiting configurations for different endpoints
export const RATE_LIMITS = {
  CHAT: { limit: 20, windowMs: 60000 }, // 20 requests per minute for chat
  SPEECH: { limit: 10, windowMs: 60000 }, // 10 requests per minute for speech (more expensive)
  RAG: { limit: 15, windowMs: 60000 }, // 15 requests per minute for RAG (uses embeddings + GPT)
  SEARCH: { limit: 30, windowMs: 60000 }, // 30 requests per minute for search (embeddings only)
} as const;