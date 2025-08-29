# Ivy Audio Narration Feature

## Overview
This feature enables Ivy to generate and cache audio narrations of all content (journal entries, book chapters, and about page) using ElevenLabs text-to-speech API.

## Key Features

### 🎯 Smart Caching
- **Deduplication**: Content is hashed to prevent regenerating identical audio
- **File Storage**: Audio files stored in `public/audio/narrations/`
- **Metadata Tracking**: JSON database tracks all cached audio files
- **Automatic Cleanup**: 30-day retention policy for cache management

### 🎵 Audio Generation
- **ElevenLabs Integration**: Uses existing API keys and voice settings
- **Content Processing**: Strips markdown and formatting for clean speech
- **Quality Settings**: Optimized voice parameters for narration
- **Rate Limiting**: 5 requests per minute to prevent abuse

### 🎮 User Interface
- **`/speak` Command**: Generate narration for current content
- **Audio Controls**: Play/pause buttons in the command bar
- **Visual Feedback**: Shows cache status (new vs. cached)
- **Smart Context**: Only available when viewing content

## Architecture

### File Structure
```
public/
  audio/
    narrations/
      journals/     # Journal entry audio files
      books/        # Book content audio files  
      chapters/     # Chapter audio files
data/
  audio-cache.json  # Metadata database
lib/
  audio-cache.ts    # Cache management system
app/api/
  narrate/         # Audio generation API endpoint
```

### Content Types
- **Journal Entries**: `contentType: 'journal'`, `contentId: filename`
- **Book Chapters**: `contentType: 'chapter'`, `contentId: 'book-chapter-file'`
- **About Page**: `contentType: 'about'`, `contentId: 'coherenceism-philosophy'`

## API Endpoints

### POST `/api/narrate`
Generate or retrieve cached narration for content.

**Request Body:**
```json
{
  "text": "Content to narrate",
  "contentType": "journal|chapter|about", 
  "contentId": "unique-identifier"
}
```

**Response:**
```json
{
  "audioUrl": "/audio/narrations/journals/abc123.mp3",
  "cached": true,
  "contentHash": "abc123..."
}
```

### GET `/api/narrate?hash=<contentHash>`
Check if narration exists for content hash.

## Usage

### For Users
1. Navigate to any journal entry or book chapter
2. Type `/speak` or click the narration option in the command bar
3. Wait for Ivy to prepare the audio (first time only)
4. Use play/pause controls to listen
5. Audio is automatically cached for future users

### For Developers
```typescript
import { AudioCacheManager } from '@/lib/audio-cache';

// Check if audio exists
const cached = AudioCacheManager.findCachedAudio(contentHash);

// Store new audio
const audioUrl = AudioCacheManager.storeAudio(
  contentHash, 
  'journal', 
  'entry-id', 
  audioBuffer
);

// Get cache statistics
const stats = AudioCacheManager.getCacheStats();
```

## Configuration

### Environment Variables
```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=voice_id_here  # Optional, has default
```

### Voice Settings
```javascript
voice_settings: {
  stability: 0.6,        // Higher for consistent delivery
  similarity_boost: 0.8, // Higher for voice consistency  
  style: 0.2,           // Slight expressiveness
  use_speaker_boost: true
}
```

## Performance Considerations

### Caching Benefits
- **Cost Savings**: Eliminates duplicate API calls to ElevenLabs
- **Speed**: Instant playback for cached content
- **Bandwidth**: Serves audio files directly from your domain
- **User Experience**: No waiting time for popular content

### Storage Management
- **Automatic Cleanup**: Removes files older than 30 days
- **Metadata Integrity**: Validates file existence on retrieval
- **Space Monitoring**: Cache statistics available for monitoring

## Security Features

### Rate Limiting
- 5 narration requests per minute per IP
- Prevents API abuse and cost overruns
- Separate from chat API limits

### Input Validation
- Content type validation (journal/chapter/about only)
- Text sanitization and length limits
- Content ID format validation

### File Security
- Audio files served from public directory
- No executable file types stored
- Secure filename generation (hashed)

## Testing

### Manual Test Scenarios
1. **First-time Generation**: Navigate to journal → `/speak` → verify audio generation
2. **Cache Retrieval**: Repeat above → verify "cached" message and instant loading  
3. **Different Content**: Try multiple entries → verify unique audio files
4. **Playback Controls**: Test play/pause functionality
5. **Navigation**: Verify audio stops when leaving content

### Cache Verification
```bash
# Check cache directory
ls -la public/audio/narrations/*/

# View metadata
cat data/audio-cache.json

# Check cache stats (in dev console)
AudioCacheManager.getCacheStats()
```

## Future Enhancements

### Potential Improvements
- **Queue System**: Background processing for large content
- **Cloud Storage**: S3/R2 integration for scalability  
- **Voice Selection**: Multiple voice options for users
- **Playlist Mode**: Auto-advance through multiple entries
- **Download Option**: Allow users to download audio files
- **Transcript Sync**: Highlight text as audio plays

### Production Scaling
- **Redis Integration**: Replace in-memory cache with Redis
- **CDN Distribution**: Serve audio files through CloudFlare
- **Database Storage**: Replace JSON metadata with proper database
- **Analytics**: Track usage patterns and popular content

## Troubleshooting

### Common Issues
1. **"No content to narrate"**: User must navigate to journal/chapter first
2. **Generation fails**: Check ElevenLabs API key and quotas
3. **Audio won't play**: Browser autoplay policies, user gesture required
4. **Cache not working**: Check file permissions on audio directories

### Debug Commands
```javascript
// In browser console
console.log('Current content:', currentContent);
console.log('Narration URL:', currentNarrationUrl);
console.log('Is playing:', isNarrationPlaying);
```

## Implementation Status
✅ Audio cache management system  
✅ ElevenLabs API integration  
✅ Content hashing and deduplication  
✅ File storage and metadata tracking  
✅ `/speak` command implementation  
✅ Audio playback controls  
✅ Cache cleanup and maintenance  
✅ Rate limiting and security  
✅ Error handling and user feedback

This feature significantly enhances the user experience by making Coherenceism content accessible through high-quality AI narration while maintaining cost efficiency through intelligent caching.