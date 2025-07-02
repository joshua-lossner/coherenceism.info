export class TextProcessor {
  private static readonly CHUNK_SIZE = 950; // Conservative limit to ensure we don't hit API limits
  private static readonly OVERLAP_SIZE = 50; // Overlap to prevent awkward cuts
  
  /**
   * Split text into chunks without breaking words
   */
  static chunkText(text: string, maxChunkSize: number = this.CHUNK_SIZE): string[] {
    if (text.length <= maxChunkSize) {
      return [text.trim()];
    }
    
    const chunks: string[] = [];
    let currentPosition = 0;
    
    while (currentPosition < text.length) {
      let chunkEnd = Math.min(currentPosition + maxChunkSize, text.length);
      
      // If we're not at the end, try to break at a natural point
      if (chunkEnd < text.length) {
        // Look for sentence endings first (. ! ?)
        const sentenceBreaks = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
        let bestBreak = -1;
        
        for (const breakPoint of sentenceBreaks) {
          const lastIndex = text.lastIndexOf(breakPoint, chunkEnd);
          if (lastIndex > currentPosition + maxChunkSize * 0.5 && lastIndex > bestBreak) {
            bestBreak = lastIndex + breakPoint.length - 1;
          }
        }
        
        // If no sentence break found, look for paragraph break
        if (bestBreak === -1) {
          const paragraphBreak = text.lastIndexOf('\n\n', chunkEnd);
          if (paragraphBreak > currentPosition + maxChunkSize * 0.5) {
            bestBreak = paragraphBreak;
          }
        }
        
        // If still no good break, look for any whitespace
        if (bestBreak === -1) {
          const spaceBreak = text.lastIndexOf(' ', chunkEnd);
          if (spaceBreak > currentPosition + maxChunkSize * 0.5) {
            bestBreak = spaceBreak;
          }
        }
        
        if (bestBreak > currentPosition) {
          chunkEnd = bestBreak;
        }
      }
      
      const chunk = text.substring(currentPosition, chunkEnd).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      currentPosition = chunkEnd;
      
      // Skip whitespace at the beginning of next chunk
      while (currentPosition < text.length && /\s/.test(text[currentPosition])) {
        currentPosition++;
      }
    }
    
    return chunks;
  }
  
  /**
   * Prepare text for speech by removing markdown and special characters
   */
  static prepareForSpeech(text: string): string {
    return text
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      .replace(/━+/g, '')
      .replace(/─+/g, '')
      .replace(/═+/g, '')
      
      // Remove markdown headers
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      
      // Remove markdown emphasis
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Bold + italic
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/_(.+?)_/g, '$1') // Italic alt
      .replace(/~~(.+?)~~/g, '$1') // Strikethrough
      
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      
      // Remove markdown images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      
      // Remove blockquotes marker but keep content
      .replace(/^>\s+/gm, '')
      
      // Remove list markers but keep content
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      
      // Remove any remaining special characters that might cause issues
      .replace(/[^\w\s.,!?;:'"()\-–—\n]/g, '')
      
      .trim();
  }
  
  /**
   * Process text through LLM for optimal speech preparation
   */
  static async cleanWithLLM(text: string): Promise<string> {
    try {
      // Skip LLM cleaning for now - just use local processing
      // The chat API isn't designed for this use case
      return this.prepareForSpeech(text);
    } catch (error) {
      console.error('Text cleaning error:', error);
      return this.prepareForSpeech(text);
    }
  }
  
  /**
   * Calculate estimated speech duration (rough estimate)
   * Average speech rate is ~150 words per minute
   */
  static estimateDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.ceil(minutes * 60); // Return seconds
  }
  
  /**
   * Add natural pauses for better speech flow
   */
  static addSpeechPauses(text: string): string {
    return text
      // Add pause after sentences
      .replace(/([.!?])\s+/g, '$1 ... ')
      // Add pause after paragraphs
      .replace(/\n\n/g, '\n\n... ... \n\n')
      // Add pause after colons
      .replace(/:\s+/g, ': ... ')
      // Add pause after semicolons
      .replace(/;\s+/g, '; ... ');
  }
}