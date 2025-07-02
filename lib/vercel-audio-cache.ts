import { put, head, del, list } from '@vercel/blob';
import crypto from 'crypto';

export interface AudioCacheEntry {
  contentHash: string;
  contentType: 'journal' | 'chapter' | 'about';
  contentId: string;
  blobUrl: string;
  createdAt: number;
  fileSize: number;
  chunks?: number;
  duration?: number;
}

export class VercelAudioCache {
  private static readonly METADATA_PREFIX = 'metadata/';
  
  /**
   * Generate content hash for deduplication
   */
  static generateContentHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex').substring(0, 16);
  }
  
  /**
   * Store audio file in Vercel Blob
   */
  static async storeAudio(
    contentHash: string,
    contentType: 'journal' | 'chapter' | 'about',
    contentId: string,
    audioBuffer: Buffer,
    chunks?: number,
    duration?: number
  ): Promise<string> {
    try {
      const filename = `audio/${contentType}/${contentHash}.mp3`;
      
      const blob = await put(filename, audioBuffer, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      // Store metadata as a separate JSON blob
      const metadata: AudioCacheEntry = {
        contentHash,
        contentType,
        contentId,
        blobUrl: blob.url,
        createdAt: Date.now(),
        fileSize: audioBuffer.length,
        chunks,
        duration
      };
      
      await this.storeMetadata(contentHash, metadata);
      
      return blob.url;
    } catch (error) {
      console.error('Error storing audio in Vercel Blob:', error);
      throw error;
    }
  }
  
  /**
   * Check if audio exists for content hash
   */
  static async findCachedAudio(contentHash: string): Promise<AudioCacheEntry | null> {
    try {
      const metadata = await this.getMetadata(contentHash);
      if (!metadata) {
        return null;
      }
      
      // Verify the blob still exists
      try {
        await head(metadata.blobUrl);
        return metadata;
      } catch {
        // Blob doesn't exist, clean up metadata
        await this.removeMetadata(contentHash);
        return null;
      }
    } catch (error) {
      console.error('Error checking cached audio:', error);
      return null;
    }
  }
  
  /**
   * Store metadata for an audio entry
   */
  private static async storeMetadata(contentHash: string, metadata: AudioCacheEntry): Promise<void> {
    try {
      const metadataFilename = `${this.METADATA_PREFIX}${contentHash}.json`;
      await put(metadataFilename, JSON.stringify(metadata), {
        access: 'public',
        addRandomSuffix: false,
      });
    } catch (error) {
      console.error('Error storing metadata:', error);
      // Don't throw - audio storage succeeded even if metadata failed
    }
  }
  
  /**
   * Get metadata for a content hash
   */
  private static async getMetadata(contentHash: string): Promise<AudioCacheEntry | null> {
    try {
      const metadataFilename = `${this.METADATA_PREFIX}${contentHash}.json`;
      const response = await fetch(await head(metadataFilename).then(blob => blob.url));
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Remove metadata for a content hash
   */
  private static async removeMetadata(contentHash: string): Promise<void> {
    try {
      const metadataFilename = `${this.METADATA_PREFIX}${contentHash}.json`;
      await del(metadataFilename);
    } catch (error) {
      console.error('Error removing metadata:', error);
    }
  }
  
  /**
   * Remove cached audio entry
   */
  static async removeCacheEntry(contentHash: string): Promise<void> {
    try {
      const metadata = await this.getMetadata(contentHash);
      if (metadata) {
        // Delete the audio blob
        await del(metadata.blobUrl);
        // Delete the metadata
        await this.removeMetadata(contentHash);
      }
    } catch (error) {
      console.error('Error removing cache entry:', error);
    }
  }
  
  /**
   * Clean up old entries (older than 30 days)
   */
  static async cleanupOldEntries(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // List all metadata files
      const { blobs } = await list({
        prefix: this.METADATA_PREFIX,
        limit: 1000
      });
      
      const toRemove: string[] = [];
      
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          const metadata: AudioCacheEntry = await response.json();
          
          if (metadata.createdAt < thirtyDaysAgo) {
            toRemove.push(metadata.contentHash);
          }
        } catch (error) {
          console.error('Error checking blob age:', error);
        }
      }
      
      // Remove old entries
      for (const contentHash of toRemove) {
        await this.removeCacheEntry(contentHash);
      }
      
      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} old audio cache entries`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    estimatedSize: number;
    byType: Record<string, number>;
  }> {
    try {
      const { blobs } = await list({
        prefix: this.METADATA_PREFIX,
        limit: 1000
      });
      
      let totalSize = 0;
      const byType: Record<string, number> = {};
      
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          const metadata: AudioCacheEntry = await response.json();
          
          totalSize += metadata.fileSize;
          byType[metadata.contentType] = (byType[metadata.contentType] || 0) + 1;
        } catch (error) {
          console.error('Error reading metadata for stats:', error);
        }
      }
      
      return {
        totalEntries: blobs.length,
        estimatedSize: totalSize,
        byType
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        estimatedSize: 0,
        byType: {}
      };
    }
  }
}

// Run cleanup periodically in production
if (process.env.NODE_ENV === 'production') {
  // Run cleanup once when the module loads
  VercelAudioCache.cleanupOldEntries().catch(console.error);
}