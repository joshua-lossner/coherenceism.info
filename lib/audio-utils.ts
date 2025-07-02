/**
 * Simple MP3 concatenation utility
 * Since all chunks come from the same ElevenLabs API with same settings,
 * we can concatenate the raw MP3 data directly
 */
export class AudioUtils {
  /**
   * Concatenate multiple audio buffers into one
   * This works for MP3 files with the same encoding settings
   */
  static concatenateAudioBuffers(buffers: Buffer[]): Buffer {
    // Simply concatenate the buffers
    // This works because MP3 files can be concatenated directly
    return Buffer.concat(buffers);
  }
  
  /**
   * Add a small silence between chunks for natural flow
   * MP3 silence frame (minimal size)
   */
  static createSilenceBuffer(durationMs: number = 200): Buffer {
    // A minimal MP3 frame representing silence
    // This is a simplified approach - in production you might want proper silence generation
    const silenceFrame = Buffer.from([
      0xFF, 0xFB, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    // Repeat silence frame to approximate duration
    // Each frame is roughly 26ms at 44.1kHz
    const framesNeeded = Math.max(1, Math.floor(durationMs / 26));
    const frames = [];
    
    for (let i = 0; i < framesNeeded; i++) {
      frames.push(silenceFrame);
    }
    
    return Buffer.concat(frames);
  }
  
  /**
   * Concatenate audio buffers with silence between them
   */
  static concatenateWithSilence(buffers: Buffer[], silenceMs: number = 200): Buffer {
    if (buffers.length === 0) {
      return Buffer.alloc(0);
    }
    
    if (buffers.length === 1) {
      return buffers[0];
    }
    
    const silence = this.createSilenceBuffer(silenceMs);
    const result: Buffer[] = [];
    
    for (let i = 0; i < buffers.length; i++) {
      result.push(buffers[i]);
      
      // Add silence between chunks (but not after the last one)
      if (i < buffers.length - 1) {
        result.push(silence);
      }
    }
    
    return Buffer.concat(result);
  }
  
  /**
   * Estimate total duration of concatenated audio
   * This is a rough estimate based on buffer size
   */
  static estimateDuration(buffer: Buffer, bitrate: number = 128): number {
    // Estimate duration based on file size and bitrate
    // Duration (seconds) = (File size in bits) / bitrate
    const fileSizeBits = buffer.length * 8;
    const bitrateBps = bitrate * 1000; // Convert kbps to bps
    return fileSizeBits / bitrateBps;
  }
}