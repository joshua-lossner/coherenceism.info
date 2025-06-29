import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit'
import { InputValidator } from '../../../lib/validation'
import { SecurityHeadersManager } from '../../../lib/security-headers'

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    const methodValidation = InputValidator.validateMethod(request, ['POST']);
    if (!methodValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(methodValidation.error!, 405);
    }

    // Validate content type
    const contentTypeValidation = InputValidator.validateContentType(request);
    if (!contentTypeValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(contentTypeValidation.error!, 400);
    }

    // Rate limiting
    const rateLimitResult = rateLimiter.check(request, RATE_LIMITS.SPEECH.limit, RATE_LIMITS.SPEECH.windowMs);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return SecurityHeadersManager.createErrorResponse(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`, 
        429
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return SecurityHeadersManager.createErrorResponse('Invalid JSON in request body', 400);
    }

    const { text } = requestBody;

    // Validate text input
    const textValidation = InputValidator.validateSpeechText(text);
    if (!textValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(textValidation.error!, 400);
    }

    const sanitizedText = textValidation.sanitized!;

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB' // Default voice

    if (!ELEVENLABS_API_KEY) {
      return SecurityHeadersManager.createErrorResponse('ElevenLabs API key not configured', 500);
    }

    // Clean text for speech (remove markdown, separators, etc.)
    const cleanText = sanitizedText
      .replace(/━+/g, '') // Remove separator lines
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .trim()

    if (!cleanText || cleanText.length < 3) {
      return SecurityHeadersManager.createErrorResponse('No valid text to synthesize', 400);
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      return SecurityHeadersManager.createErrorResponse('Speech synthesis failed', response.status);
    }

    const audioBuffer = await response.arrayBuffer()
    
    const audioResponse = new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

    return SecurityHeadersManager.applyToResponse(audioResponse);

  } catch (error: any) {
    console.error('Speech API error:', error)
    return SecurityHeadersManager.createErrorResponse('Internal server error', 500);
  }
} 