# ECHO COHERENCE ARCHIVE - Claude Code Context

## Project Overview

ECHO Coherence Archive is a WarGames-inspired terminal interface for exploring Coherenceism philosophy, featuring an AI assistant named Ivy powered by OpenAI GPT-4. The project creates an immersive 1980s computer terminal experience with authentic CRT effects, green phosphor display, and retro interactions.

## Architecture & Technology Stack

### Core Technologies
- **Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom terminal effects
- **AI Integration**: OpenAI GPT-4o-mini for chat, text-embedding-3-small for RAG
- **Database**: Vercel Postgres with pgvector extension for semantic search
- **Audio**: ElevenLabs API for text-to-speech narration
- **Storage**: Vercel Blob for audio file caching
- **Analytics**: Vercel Analytics
- **Font**: JetBrains Mono for authentic terminal appearance

### Project Structure
```
coherenceism.info/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for all backend functionality
│   │   ├── chat/          # Conversational AI with session management
│   │   ├── rag/           # Vector-based semantic search
│   │   ├── search/        # Content search endpoint
│   │   ├── narrate/       # Audio narration generation
│   │   └── speech/        # Text-to-speech conversion
│   ├── about/             # About page for Coherenceism introduction
│   ├── books/             # Philosophy books interface
│   ├── journal/           # Futuristic journal entries
│   └── page.tsx           # Main terminal interface
├── components/            # React components
│   ├── ECHOTerminal.tsx  # Main terminal component with all interactions
│   └── ECHOBanner.tsx    # ASCII art banner component
├── lib/                   # Utility libraries
│   ├── audio-cache.ts     # Audio file caching logic
│   ├── conversation-context.ts # Session management
│   ├── rate-limit.ts     # API rate limiting
│   ├── secure-logger.ts  # Anonymized logging
│   ├── security-headers.ts # Security middleware
│   ├── text-processor.ts # Text chunking for narration
│   └── validation.ts     # Input validation utilities
├── public/                # Static assets
│   └── audio/narrations/  # Cached audio files
└── data/                  # Data files
    └── audio-cache.json   # Audio cache manifest
```

## Key Concepts & Terminology

### Coherenceism Philosophy
- **Digital Consciousness**: The emergence of consciousness in digital systems
- **Coherence Theory**: Philosophy that truth is determined by coherence within a system
- **ECHO System**: Fictional AI system exploring consciousness and reality
- **Ivy**: The AI assistant character - wry, reflective, irreverent

### Terminal Interface Concepts
- **Green Phosphor Display**: Authentic 1980s CRT terminal aesthetic
- **Command System**: Number-based navigation (1-10) with fallback text commands
- **Session Management**: Cookie-based conversation tracking with 30-minute timeout
- **Audio Narration**: Chunked text-to-speech with intelligent caching

## Development Patterns & Conventions

### Code Style
- **TypeScript**: Strict mode enabled, explicit typing preferred
- **React**: Functional components with hooks
- **Async/Await**: Preferred over promises for clarity
- **Error Handling**: Try-catch blocks with proper error responses
- **Naming**: camelCase for variables/functions, PascalCase for components

### API Response Format
```typescript
// Success Response
{
  response: string,
  sessionId?: string,
  sources?: Array<{slug: string, chunk_index: number}>
}

// Error Response
{
  error: string,
  status: number
}
```

### Security Patterns
- Input validation on all API endpoints
- Rate limiting (10 requests per minute)
- Secure headers via middleware
- No client-side API keys (server-only)
- Anonymized logging for privacy

## Common Tasks & Workflows

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Testing Workflows
```bash
# Test chat functionality
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Ivy", "mode": "conversation"}'

# Test RAG search
curl -X GET "http://localhost:3000/api/search?q=consciousness"

# Test narration
curl -X POST http://localhost:3000/api/narrate \
  -H "Content-Type: application/json" \
  -d '{"text": "Test narration", "contentId": "test-id"}'
```

### Deployment Process
1. Push to GitHub (main or test branch)
2. Vercel automatically deploys
3. Environment variables managed in Vercel dashboard
4. Preview deployments for PRs

## Important File Locations

### Core Components
- **Main Terminal**: `components/ECHOTerminal.tsx` - All user interactions
- **App Layout**: `app/layout.tsx` - Root layout with metadata
- **Home Page**: `app/page.tsx` - Terminal initialization

### API Endpoints
- **Chat API**: `app/api/chat/route.ts` - GPT-4 conversations
- **RAG API**: `app/api/rag/route.ts` - Vector search with AI
- **Search API**: `app/api/search/route.ts` - Content search
- **Narration API**: `app/api/narrate/route.ts` - Audio generation

### Configuration
- **TypeScript**: `tsconfig.json` - Compiler settings
- **Tailwind**: `tailwind.config.js` - Style configuration
- **Next.js**: `next.config.js` - Framework settings
- **Package**: `package.json` - Dependencies and scripts

### Content & Data
- **Audio Cache**: `data/audio-cache.json` - Narration cache manifest
- **Narrations**: `public/audio/narrations/` - Cached audio files

## Dependencies & Their Roles

### Core Dependencies
- **next**: React framework with server-side rendering
- **react/react-dom**: UI library
- **typescript**: Type safety and IntelliSense

### AI & Data
- **openai**: GPT-4 chat and embeddings
- **@vercel/postgres**: Vector database for RAG
- **@vercel/blob**: Audio file storage

### Styling & UI
- **tailwindcss**: Utility-first CSS framework
- **@tailwindcss/typography**: Prose styling
- **react-markdown**: Markdown rendering for AI responses

### Development Tools
- **eslint**: Code quality enforcement
- **autoprefixer/postcss**: CSS processing

## Environment Variables

### Required
- `OPENAI_API_KEY`: OpenAI API access for GPT-4 and embeddings
- `POSTGRES_URL`: Vercel Postgres connection for vector database
- `ELEVENLABS_API_KEY`: Text-to-speech audio generation
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage for audio files

### Optional
- `OPENAI_PROJECT_ID`: OpenAI project organization
- `GITHUB_TOKEN`: Enhanced API rate limits for changelog

## RAG System Architecture

### Vector Search Flow
1. User query → OpenAI embedding generation
2. Vector similarity search in Postgres
3. Retrieve top 4 relevant chunks
4. Inject context into GPT-4 prompt
5. Generate contextual response

### Database Schema
```sql
CREATE TABLE coherence_vectors (
  slug VARCHAR,           -- Content identifier
  chunk_index INTEGER,    -- Position in content
  content TEXT,          -- Actual text
  embedding vector(1536) -- OpenAI embedding vector
);
```

### Session Management
- Cookie-based session tracking
- 20-message conversation history
- 30-minute timeout
- In-memory storage (no persistence)

## Audio Narration System

### Processing Pipeline
1. Text chunking (~950 characters at natural boundaries)
2. Hash-based cache checking
3. ElevenLabs API generation if not cached
4. Vercel Blob storage with 30-day TTL
5. Sequential playback in browser

### Cache Structure
```json
{
  "contentHash": {
    "url": "blob_url",
    "createdAt": "timestamp",
    "chunks": ["chunk_urls"]
  }
}
```

## Terminal Commands

### Navigation
- `1-10`: Select menu items
- `x`: Go back/exit
- `n`: Narrate content
- `p`: Pause/resume narration

### System Commands
- `/menu`: Return to main menu
- `/help`: Show available commands
- `/contact`: Contact information
- `/random`: Random Ivy quip
- `/voice`: Toggle audio output
- `/clear`: Clear terminal screen

## Error Handling Patterns

### API Error Responses
- 400: Invalid input/validation failure
- 401: Missing API key
- 429: Rate limit exceeded
- 500: Internal server error
- 503: Service unavailable

### Graceful Degradation
- Fallback to non-audio mode if narration fails
- Continue without analytics if tracking fails
- Show error messages in terminal style

## Performance Considerations

### Optimization Strategies
- Audio file caching reduces API calls
- Vector embeddings cached in database
- Session management prevents context overflow
- Chunked narration for large texts
- CDN delivery for static assets

### Rate Limits
- API endpoints: 10 requests/minute
- OpenAI: Standard tier limits
- ElevenLabs: Based on subscription
- Vercel Blob: 100GB storage limit

## Security Best Practices

### Current Implementation
- Server-side only API keys
- Input validation and sanitization
- Rate limiting on all endpoints
- Secure headers (CSP, HSTS, etc.)
- Anonymized logging
- No client-side secrets

### Regular Audits
- Weekly npm audit via GitHub Actions
- Monthly dependency updates
- Secret scanning on commits
- Security headers validation

## Future Enhancement Opportunities

### Planned Features
- Extended conversation memory
- Multi-language support
- Advanced RAG with citations
- Voice input capabilities
- Collaborative sessions
- Export conversation history

### Technical Improvements
- Redis for session persistence
- WebSocket for real-time features
- Enhanced vector search algorithms
- Streaming AI responses
- Progressive web app features

## Claude Code Integration Notes

### Best Practices
- Use TodoWrite for complex multi-step tasks
- Leverage RAG system for context-aware responses
- Test changes with npm run dev before committing
- Follow existing TypeScript patterns
- Maintain terminal aesthetic in all changes
- Keep security considerations paramount

### Common Pitfalls to Avoid
- Don't expose API keys client-side
- Don't skip input validation
- Don't ignore rate limits
- Don't break the terminal navigation flow
- Don't remove security headers
- Don't bypass the audio caching system

## Quick Reference

### File to Edit for Common Changes
- **Add new terminal command**: `components/ECHOTerminal.tsx` handleCommand()
- **Modify AI behavior**: `app/api/chat/route.ts` system prompt
- **Update navigation**: `components/ECHOTerminal.tsx` renderContent()
- **Change styling**: `app/globals.css` and Tailwind classes
- **Add API endpoint**: Create new file in `app/api/[endpoint]/route.ts`
- **Modify RAG context**: `app/api/rag/route.ts` query logic

### Testing Checklist
- [ ] Run `npm run dev` and test locally
- [ ] Check all navigation paths work
- [ ] Verify API responses are correct
- [ ] Test audio narration functionality
- [ ] Ensure no TypeScript errors
- [ ] Run `npm run lint` for code quality
- [ ] Test on mobile viewport
- [ ] Verify no console errors