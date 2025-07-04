// Security headers configuration

export interface SecurityHeaders {
  [key: string]: string;
}

export class SecurityHeadersManager {
  // API endpoint security headers
  static getApiHeaders(): SecurityHeaders {
    return {
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // XSS protection (legacy but still good to have)
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent information disclosure
      'X-Powered-By': 'ECHO-3.7.42',
      
      // Cache control for sensitive endpoints
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      
      // Content Security Policy - relaxed for Next.js functionality
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'",
      
      // Referrer policy
      'Referrer-Policy': 'no-referrer',
      
      // Strict transport security (if HTTPS)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
  }

  // Apply security headers to a NextResponse
  static applyToResponse(response: Response): Response {
    const headers = this.getApiHeaders();
    
    // Apply each header
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    
    return response;
  }

  // Create a secure error response
  static createErrorResponse(message: string, status: number = 400): Response {
    const response = new Response(
      JSON.stringify({ 
        error: message,
        timestamp: new Date().toISOString(),
      }), 
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...this.getApiHeaders(),
        },
      }
    );
    
    return response;
  }

  // Create a secure success response
  static createSuccessResponse(data: any, status: number = 200): Response {
    const response = new Response(
      JSON.stringify(data),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...this.getApiHeaders(),
        },
      }
    );
    
    return response;
  }
}