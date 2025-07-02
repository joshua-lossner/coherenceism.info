import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface AudioCacheEntry {
  contentHash: string;
  contentType: 'journal' | 'chapter' | 'about';
  contentId: string; // journal filename, chapter id, etc.
  audioPath: string;
  createdAt: number;
  fileSize: number;
  chunks?: number; // Number of chunks if content was split
  duration?: number; // Estimated duration in seconds
}

export class AudioCacheManager {
  private static readonly CACHE_DIR = path.join(process.cwd(), 'public', 'audio', 'narrations');
  private static readonly METADATA_FILE = path.join(process.cwd(), 'data', 'audio-cache.json');
  
  // Ensure directories exist
  static ensureDirectories() {
    const dirs = [
      this.CACHE_DIR,
      path.join(this.CACHE_DIR, 'journals'),
      path.join(this.CACHE_DIR, 'chapters'),
      path.join(this.CACHE_DIR, 'about'),
      path.dirname(this.METADATA_FILE)
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  // Generate content hash for deduplication
  static generateContentHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex').substring(0, 16);
  }
  
  // Load metadata from file
  static loadMetadata(): AudioCacheEntry[] {
    try {
      if (fs.existsSync(this.METADATA_FILE)) {
        const data = fs.readFileSync(this.METADATA_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading audio cache metadata:', error);
    }
    return [];
  }
  
  // Save metadata to file
  static saveMetadata(entries: AudioCacheEntry[]) {
    try {
      this.ensureDirectories();
      fs.writeFileSync(this.METADATA_FILE, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error('Error saving audio cache metadata:', error);
    }
  }
  
  // Check if audio exists for content
  static findCachedAudio(contentHash: string): AudioCacheEntry | null {
    const metadata = this.loadMetadata();
    const entry = metadata.find(m => m.contentHash === contentHash);
    
    if (entry && fs.existsSync(path.join(process.cwd(), 'public', entry.audioPath))) {
      return entry;
    }
    
    // Clean up metadata if file doesn't exist
    if (entry) {
      this.removeCacheEntry(contentHash);
    }
    
    return null;
  }
  
  // Store audio file and metadata
  static storeAudio(
    contentHash: string, 
    contentType: 'journal' | 'chapter' | 'about',
    contentId: string,
    audioBuffer: Buffer,
    chunks?: number,
    duration?: number
  ): string {
    this.ensureDirectories();
    
    const filename = `${contentHash}.mp3`;
    const dirName = contentType === 'journal' ? 'journals' : 
                   contentType === 'chapter' ? 'chapters' : 'about';
    const relativePath = `audio/narrations/${dirName}/${filename}`;
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    // Write audio file
    fs.writeFileSync(fullPath, audioBuffer);
    
    // Update metadata
    const metadata = this.loadMetadata();
    const newEntry: AudioCacheEntry = {
      contentHash,
      contentType,
      contentId,
      audioPath: relativePath,
      createdAt: Date.now(),
      fileSize: audioBuffer.length,
      chunks,
      duration
    };
    
    // Remove existing entry if it exists
    const filteredMetadata = metadata.filter(m => m.contentHash !== contentHash);
    filteredMetadata.push(newEntry);
    
    this.saveMetadata(filteredMetadata);
    
    return `/${relativePath}`;
  }
  
  // Remove cache entry
  static removeCacheEntry(contentHash: string) {
    const metadata = this.loadMetadata();
    const entry = metadata.find(m => m.contentHash === contentHash);
    
    if (entry) {
      // Remove file
      const fullPath = path.join(process.cwd(), 'public', entry.audioPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      
      // Update metadata
      const filteredMetadata = metadata.filter(m => m.contentHash !== contentHash);
      this.saveMetadata(filteredMetadata);
    }
  }
  
  // Clean up old entries (older than 30 days)
  static cleanupOldEntries() {
    const metadata = this.loadMetadata();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const toRemove = metadata.filter(entry => entry.createdAt < thirtyDaysAgo);
    
    toRemove.forEach(entry => {
      this.removeCacheEntry(entry.contentHash);
    });
    
    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} old audio cache entries`);
    }
  }
  
  // Get cache statistics
  static getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    byType: Record<string, number>;
  } {
    const metadata = this.loadMetadata();
    
    const stats = {
      totalEntries: metadata.length,
      totalSize: metadata.reduce((sum, entry) => sum + entry.fileSize, 0),
      byType: metadata.reduce((acc, entry) => {
        acc[entry.contentType] = (acc[entry.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  }
  
  // Clean text for consistent hashing (same as speech API)
  static cleanTextForHashing(text: string): string {
    return text
      .replace(/━+/g, '') // Remove separator lines
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .trim();
  }
}

// Run cleanup periodically in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    AudioCacheManager.cleanupOldEntries();
  }, 24 * 60 * 60 * 1000); // Daily cleanup
}