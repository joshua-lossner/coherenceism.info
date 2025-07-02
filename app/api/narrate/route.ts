import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { InputValidator } from '../../../lib/validation';
import { SecurityHeadersManager } from '../../../lib/security-headers';
import { AudioCacheManager } from '../../../lib/audio-cache';
import { TextProcessor } from '../../../lib/text-processor';
import { AudioUtils } from '../../../lib/audio-utils';

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

    // Rate limiting (more restrictive for narration since it's expensive)
    const rateLimitResult = rateLimiter.check(request, 5, 60000); // 5 requests per minute
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

    const { text, contentType, contentId } = requestBody;

    // Validate inputs using narration-specific validation (allows longer text)
    const textValidation = InputValidator.validateNarrationText(text);
    if (!textValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(textValidation.error!, 400);
    }

    if (!contentType || !['journal', 'chapter', 'about'].includes(contentType)) {
      return SecurityHeadersManager.createErrorResponse('Invalid content type', 400);
    }

    if (!contentId || typeof contentId !== 'string') {
      return SecurityHeadersManager.createErrorResponse('Content ID is required', 400);
    }

    const sanitizedText = textValidation.sanitized!;
    
    // Clean text through LLM for better speech quality
    let cleanText: string;
    try {
      console.log('Cleaning text through LLM...');
      cleanText = await TextProcessor.cleanWithLLM(sanitizedText);
    } catch (error) {
      console.log('LLM cleaning failed, using basic cleaning');
      cleanText = TextProcessor.prepareForSpeech(sanitizedText);
    }
    
    // Add natural pauses for better flow
    cleanText = TextProcessor.addSpeechPauses(cleanText);
    
    // Generate hash based on cleaned text
    const contentHash = AudioCacheManager.generateContentHash(cleanText);

    // Check if audio already exists in cache
    const cachedEntry = AudioCacheManager.findCachedAudio(contentHash);
    if (cachedEntry) {
      // Check if this is a chunked entry by looking for chunk files
      const chunkUrls: string[] = [];
      if (cachedEntry.chunks && cachedEntry.chunks > 1) {
        for (let i = 0; i < cachedEntry.chunks; i++) {
          const chunkHash = `${contentHash}-chunk-${i}`;
          const chunkEntry = AudioCacheManager.findCachedAudio(chunkHash);
          if (chunkEntry) {
            chunkUrls.push(`/${chunkEntry.audioPath}`);
          }
        }
      }
      
      if (chunkUrls.length > 0) {
        return NextResponse.json({
          audioUrls: chunkUrls,
          cached: true,
          contentHash,
          duration: cachedEntry.duration,
          chunks: cachedEntry.chunks
        });
      } else {
        // Single file (legacy or single chunk)
        return NextResponse.json({
          audioUrls: [`/${cachedEntry.audioPath}`],
          cached: true,
          contentHash,
          duration: cachedEntry.duration,
          chunks: 1
        });
      }
    }

    // Generate new audio if not cached
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

    if (!ELEVENLABS_API_KEY) {
      return SecurityHeadersManager.createErrorResponse('ElevenLabs API key not configured', 500);
    }

    // Check if text needs to be chunked
    const chunks = TextProcessor.chunkText(cleanText, 950); // Conservative limit
    console.log(`Processing ${chunks.length} chunks for narration`);
    
    if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length < 3)) {
      return SecurityHeadersManager.createErrorResponse('No valid text to synthesize', 400);
    }
    
    // Generate audio for each chunk
    const audioBuffers: Buffer[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Generating audio for chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`ElevenLabs API error for chunk ${i + 1}:`, response.status, errorText);
          throw new Error(`Speech synthesis failed for chunk ${i + 1}`);
        }

        const chunkBuffer = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(chunkBuffer);
        
        // Small delay between API calls to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        return SecurityHeadersManager.createErrorResponse(
          `Speech synthesis failed at chunk ${i + 1} of ${chunks.length}`, 
          500
        );
      }
    }
    
    // Store each chunk separately for sequential playback
    const chunkUrls: string[] = [];
    let totalDuration = 0;
    
    for (let i = 0; i < audioBuffers.length; i++) {
      const chunkBuffer = audioBuffers[i];
      const chunkHash = `${contentHash}-chunk-${i}`;
      const chunkDuration = AudioUtils.estimateDuration(chunkBuffer);
      totalDuration += chunkDuration;
      
      const chunkUrl = AudioCacheManager.storeAudio(
        chunkHash,
        contentType as 'journal' | 'chapter' | 'about',
        `${contentId}-chunk-${i}`,
        chunkBuffer,
        1,
        chunkDuration
      );
      
      chunkUrls.push(chunkUrl);
    }

    // Store master entry that references all chunks
    const masterEntry = {
      contentHash,
      contentType: contentType as 'journal' | 'chapter' | 'about',
      contentId,
      audioPath: chunkUrls[0].substring(1), // Use first chunk path as reference
      createdAt: Date.now(),
      fileSize: audioBuffers.reduce((sum, buf) => sum + buf.length, 0),
      chunks: chunks.length,
      duration: totalDuration
    };
    
    const metadata = AudioCacheManager.loadMetadata();
    const filteredMetadata = metadata.filter(m => m.contentHash !== contentHash);
    filteredMetadata.push(masterEntry);
    AudioCacheManager.saveMetadata(filteredMetadata);

    // Log cache stats in development
    if (process.env.NODE_ENV === 'development') {
      const stats = AudioCacheManager.getCacheStats();
      console.log('Audio cache stats:', stats);
      console.log(`Generated ${chunks.length} chunks, total duration: ~${Math.round(totalDuration)}s`);
    }

    return NextResponse.json({
      audioUrls: chunkUrls, // Return array of chunk URLs
      cached: false,
      contentHash,
      chunks: chunks.length,
      duration: totalDuration
    });

  } catch (error: any) {
    console.error('Narration API error:', error);
    return SecurityHeadersManager.createErrorResponse('Internal server error', 500);
  }
}

// GET endpoint to check if narration exists
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const contentHash = url.searchParams.get('hash');
    
    if (!contentHash) {
      return SecurityHeadersManager.createErrorResponse('Content hash required', 400);
    }

    const cachedEntry = AudioCacheManager.findCachedAudio(contentHash);
    
    if (cachedEntry) {
      return NextResponse.json({
        exists: true,
        audioUrl: `/${cachedEntry.audioPath}`,
        contentType: cachedEntry.contentType,
        createdAt: cachedEntry.createdAt
      });
    }

    return NextResponse.json({ exists: false });

  } catch (error: any) {
    console.error('Narration check error:', error);
    return SecurityHeadersManager.createErrorResponse('Internal server error', 500);
  }
}