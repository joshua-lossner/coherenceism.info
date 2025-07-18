// Secure logging utility with environment-based levels
// Prevents logging of sensitive information

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class SecureLogger {
  private static shouldLog(level: LogLevel): boolean {
    // Only log in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production') {
      // In production, only log errors unless DEBUG is set
      return level === 'error' || process.env.DEBUG === 'true';
    }
    return true; // Log everything in development
  }

  private static sanitizeData(data: LogData): LogData {
    const sanitized: LogData = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Skip sensitive keys entirely
      if (lowerKey.includes('password') || 
          lowerKey.includes('token') || 
          lowerKey.includes('key') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('auth')) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Anonymize IP addresses
      if (lowerKey.includes('ip') && typeof value === 'string') {
        sanitized[key] = this.anonymizeIP(value);
        continue;
      }
      
      // Hash session IDs
      if (lowerKey.includes('session') && typeof value === 'string') {
        sanitized[key] = this.hashValue(value);
        continue;
      }
      
      // Truncate long strings that might contain sensitive data
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
        continue;
      }
      
      sanitized[key] = value;
    }
    
    return sanitized;
  }

  private static anonymizeIP(ip: string): string {
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    if (parts.length >= 4) {
      // IPv4: keep first two octets
      return `${parts[0]}.${parts[1]}.x.x`;
    } else if (ip.includes(':')) {
      // IPv6: keep only first segment
      const firstSegment = ip.split(':')[0];
      return `${firstSegment}:x:x:x:x:x:x:x`;
    }
    return 'invalid';
  }

  private static hashValue(value: string): string {
    // Simple hash for session IDs (not cryptographic, just for privacy)
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash).toString(16)}`;
  }

  static debug(message: string, data?: LogData): void {
    if (!this.shouldLog('debug')) return;
    
    if (data) {
      console.log(`[DEBUG] ${message}`, this.sanitizeData(data));
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  static info(message: string, data?: LogData): void {
    if (!this.shouldLog('info')) return;
    
    if (data) {
      console.log(`[INFO] ${message}`, this.sanitizeData(data));
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  static warn(message: string, data?: LogData): void {
    if (!this.shouldLog('warn')) return;
    
    if (data) {
      console.warn(`[WARN] ${message}`, this.sanitizeData(data));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  static error(message: string, error?: Error | LogData): void {
    if (!this.shouldLog('error')) return;
    
    if (error instanceof Error) {
      // For Error objects, only log the message and stack in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${message}`, {
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error(`[ERROR] ${message}: ${error.message}`);
      }
    } else if (error) {
      console.error(`[ERROR] ${message}`, this.sanitizeData(error));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  // Special method for API errors that might contain sensitive info
  static apiError(message: string, error: any, statusCode?: number): void {
    const sanitizedError = {
      message: error?.message || 'Unknown error',
      status: error?.status || statusCode || 'unknown',
      // Don't log the full error object which might contain sensitive data
    };
    
    this.error(message, sanitizedError);
  }
}

export default SecureLogger;