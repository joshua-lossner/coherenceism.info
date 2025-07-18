// Input validation utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export class InputValidator {
  // Validate chat message input
  static validateChatMessage(message: unknown): ValidationResult {
    // Check if message exists and is a string
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        error: 'Message must be a non-empty string',
      };
    }

    // Check length limits
    if (message.length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty',
      };
    }

    if (message.length > 2000) {
      return {
        isValid: false,
        error: 'Message too long (max 2000 characters)',
      };
    }

    // Sanitize: trim whitespace and remove potentially dangerous characters
    const sanitized = message
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 2000); // Ensure length limit

    // Check if sanitized message is still valid
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'Message contains only invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  // Validate speech text input
  static validateSpeechText(text: unknown): ValidationResult {
    // Check if text exists and is a string
    if (!text || typeof text !== 'string') {
      return {
        isValid: false,
        error: 'Text must be a non-empty string',
      };
    }

    // Check length limits (speech synthesis is expensive)
    if (text.length === 0) {
      return {
        isValid: false,
        error: 'Text cannot be empty',
      };
    }

    if (text.length > 1000) {
      return {
        isValid: false,
        error: 'Text too long for speech synthesis (max 1000 characters)',
      };
    }

    // Sanitize: clean up for speech synthesis
    const sanitized = text
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[^\w\s\.,!?;:()\-'"]/g, ' ') // Only allow safe characters for speech
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000);

    if (sanitized.length < 3) {
      return {
        isValid: false,
        error: 'Text too short or contains only invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  // Validate mode parameter
  static validateMode(mode: unknown): ValidationResult {
    const validModes = ['conversation', 'query'];
    
    if (!mode || typeof mode !== 'string') {
      return {
        isValid: true,
        sanitized: 'conversation', // Default fallback
      };
    }

    if (!validModes.includes(mode)) {
      return {
        isValid: true,
        sanitized: 'conversation', // Default fallback for invalid modes
      };
    }

    return {
      isValid: true,
      sanitized: mode,
    };
  }

  // General content type validation for API requests
  static validateContentType(request: Request): ValidationResult {
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return {
        isValid: false,
        error: 'Content-Type must be application/json',
      };
    }

    return { isValid: true };
  }

  // Validate request method
  static validateMethod(request: Request, allowedMethods: string[]): ValidationResult {
    if (!allowedMethods.includes(request.method)) {
      return {
        isValid: false,
        error: `Method ${request.method} not allowed`,
      };
    }

    return { isValid: true };
  }

  // Validate narration text input (allows longer text for chunking)
  static validateNarrationText(text: unknown): ValidationResult {
    // Check if text exists and is a string
    if (!text || typeof text !== 'string') {
      return {
        isValid: false,
        error: 'Text must be a non-empty string',
      };
    }

    // Check length limits (much higher for narration since we chunk)
    if (text.length === 0) {
      return {
        isValid: false,
        error: 'Text cannot be empty',
      };
    }

    // Allow up to 50,000 characters (will be chunked)
    if (text.length > 50000) {
      return {
        isValid: false,
        error: 'Text too long for narration (max 50,000 characters)',
      };
    }

    // Sanitize: clean up for speech synthesis
    const sanitized = text
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 50000);

    if (sanitized.length < 3) {
      return {
        isValid: false,
        error: 'Text too short or contains only invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  // Validate RAG query input
  static validateRAGQuery(message: unknown): ValidationResult {
    // Check if message exists and is a string
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        error: 'Query must be a non-empty string',
      };
    }

    // Check length limits
    if (message.length === 0) {
      return {
        isValid: false,
        error: 'Query cannot be empty',
      };
    }

    // RAG queries should be shorter than chat messages for optimal performance
    if (message.length > 1000) {
      return {
        isValid: false,
        error: 'Query too long (max 1000 characters)',
      };
    }

    // Sanitize: trim whitespace and remove potentially dangerous characters
    const sanitized = message
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Ensure length limit

    // Check if sanitized message is still valid
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'Query contains only invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  // Validate search query input
  static validateSearchQuery(query: unknown): ValidationResult {
    // Check if query exists and is a string
    if (!query || typeof query !== 'string') {
      return {
        isValid: false,
        error: 'Search query must be a non-empty string',
      };
    }

    // Check length limits
    if (query.length === 0) {
      return {
        isValid: false,
        error: 'Search query cannot be empty',
      };
    }

    // Search queries should be concise for optimal performance
    if (query.length > 500) {
      return {
        isValid: false,
        error: 'Search query too long (max 500 characters)',
      };
    }

    // Sanitize: trim whitespace and remove potentially dangerous characters
    const sanitized = query
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Ensure length limit

    // Check if sanitized query is still valid
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'Search query contains only invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }
}