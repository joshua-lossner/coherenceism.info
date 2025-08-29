# ECHO COHERENCE ARCHIVE

A retro terminal interface for exploring Coherenceism philosophy, powered by OpenAI's GPT-5.

For guidelines when using AI coding assistants (e.g., OpenAI Codex or ChatGPT), see [AGENTS.md](AGENTS.md).

## 🖥️ Features

- **Authentic 1980s Terminal**: Green phosphor display with CRT scanlines
- **Ivy AI Assistant**: GPT-5 powered conversations about consciousness and technology
- **Audio Narration**: Ivy narrates all content with intelligent caching and seamless playback
- **Content Archive**: Browse philosophical texts and futuristic journal entries
- **Interactive Commands**: Navigate through books, journals, and AI queries
- **Retro Aesthetics**: JetBrains Mono font, terminal effects, and classic styling

## 🚀 Setup

### 1. Clone and Install
```bash
git clone https://github.com/joshua-lossner/coherenceism.info.git
cd coherenceism.info
npm install
```

### 2. Configure API Keys
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
POSTGRES_URL=your_vercel_postgres_url_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the terminal.

## 🎮 Navigation

### Main Menu
Navigate using numbers:
- `1` or `1.` - Journal - Read latest journal entries
- `2` or `2.` - Books - Browse Coherenceism texts
- `3` or `3.` - Music - Curated playlists and soundscapes
- `4` or `4.` - About - Introduction to Coherenceism

### Navigation Controls
- `x` - Go back to previous menu/screen
- Numbers (`1-10`) - Select menu items
- Both `2` and `2.` formats work for all numbers

### Available Commands
Type `/help` to see:
- `/menu` - Return to main menu
- `/help` - Display available commands and instructions
- `/contact` - Information for reaching out
- `/random` - Receive a random Ivy-generated thought or wry quip
- `/voice` - Toggle audio output (Ivy speaks responses aloud)
- `/clear` - Clear terminal screen

### Content Navigation Commands
-When viewing journal entries or book chapters:
- `n` or `n.` - Narrate current content (Ivy reads it aloud)
- `p` or `p.` - Pause/resume narration

## 🤖 AI Interaction

**Direct Conversation**: Type anything to chat with Ivy about consciousness, technology, and philosophy.

**Structured Queries**: Use `query [your question]` for focused philosophical discussions.

## 🧠 RAG System (Retrieval-Augmented Generation)

The ECHO system features a sophisticated RAG architecture that combines vector search with conversational AI to provide contextually relevant responses about Coherenceism philosophy.

### System Architecture

**Dual RAG Implementation**:
- **Vector RAG** (`/api/rag`, `/api/search`) - Semantic search using OpenAI embeddings
- **Conversational AI** (`/api/chat`) - Session-based chat with context management

### Core Components

#### 1. Vector-Based Retrieval
```typescript
// Query Processing Flow
User Query → OpenAI Embedding → Vector Similarity Search → Context Assembly → AI Response
```

**Technologies**:
- **Embeddings**: OpenAI `text-embedding-3-small` model
- **Vector Database**: Vercel Postgres with pgvector extension
- **Generation**: OpenAI `gpt-5` with 250 token limit
- **Storage**: `coherence_vectors` table with semantic chunks

#### 2. Conversation Management
```typescript
// Session-Based Chat Flow
User Input → Session Tracking → Context Retrieval → AI Response → Session Update
```

**Features**:
- Cookie-based session management
- 20-message conversation history
- 30-minute session timeout
- In-memory conversation storage

### API Endpoints

#### Vector RAG Endpoint
```bash
POST /api/rag
{
  "message": "What is digital consciousness?"
}

# Response includes contextual answer + source attribution
{
  "response": "Ivy's contextual response...",
  "sources": [{"slug": "digital-consciousness", "chunk_index": 0}]
}
```

#### Search Endpoint
```bash
GET /api/search?q=consciousness
# Returns top 8 relevant content chunks with source metadata
```

#### Chat Endpoint
```bash
POST /api/chat
{
  "message": "Hello Ivy",
  "mode": "conversation",  # or "query"
  "clearContext": false
}

# Response includes session tracking
{
  "response": "Hey there! Ready for some witty banter?",
  "sessionId": "session-id-123"
}
```

### Database Schema

```sql
-- Vector storage for semantic search
CREATE TABLE coherence_vectors (
  slug VARCHAR,           -- Content identifier
  chunk_index INTEGER,    -- Chunk position
  content TEXT,          -- Text content
  embedding vector(1536) -- OpenAI embedding
);

-- Requires pgvector extension
CREATE EXTENSION vector;
```

### Implementation Details

**Vector Similarity Search**:
```sql
SELECT slug, chunk_index, content
FROM coherence_vectors
ORDER BY embedding <-> ${queryVector}::vector
LIMIT 4;
```

**Context Assembly**:
- Retrieves 4 most relevant chunks per query
- Combines chunks with separator tokens
- Injects context into system prompt for AI generation

**Error Handling**:
- Graceful degradation for API failures
- Rate limiting with 429 responses
- Input validation and security headers

### Configuration

**Required Environment Variables**:
```bash
OPENAI_API_KEY=sk-...          # OpenAI API access
POSTGRES_URL=postgres://...    # Vercel Postgres with pgvector
```

**Optional Variables**:
```bash
OPENAI_PROJECT_ID=proj-...     # OpenAI project organization
```

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling and terminal effects
- **OpenAI API** - GPT-5 integration for AI conversations and embeddings
- **Vercel Postgres** - Database with pgvector extension for vector search
- **ElevenLabs API** - High-quality text-to-speech for audio narration

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-5 access and embeddings | Yes |
| `POSTGRES_URL` | Vercel Postgres connection string for vector database | Yes |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key for audio narration | Yes |
| `BLOB_READ_WRITE_TOKEN` | Your Vercel Blob token for audio file storage | Yes |
| `OPENAI_PROJECT_ID` | OpenAI project organization ID | No |
| `GITHUB_TOKEN` | GitHub personal access token for changelog (increases API rate limit) | No |

## 🎧 Audio Narration System

The audio narration feature allows Ivy to read journal entries and book chapters aloud using ElevenLabs' advanced text-to-speech technology.

### How It Works
- **Intelligent Chunking**: Long content is automatically split into ~950 character chunks at natural boundaries
- **Smart Caching**: Audio files are cached using Vercel Blob storage by content hash to avoid regenerating identical narrations
- **Sequential Playback**: Chunks play seamlessly in sequence for uninterrupted listening
- **Auto-cleanup**: Cached audio files are automatically removed after 30 days

### Storage & Delivery
- **Vercel Blob Storage**: S3-backed, globally distributed storage for audio files
- **CDN Delivery**: Fast audio streaming worldwide through Vercel's global network
- **Persistent Caching**: Audio survives deployments and is shared across all users

### Usage
1. Navigate to any journal entry or book chapter
2. Type `n` to start narration
3. Use `p` to pause/resume playback
4. Narration automatically stops when navigating away

## 🎨 Theme

Inspired by the ECHO system, featuring:
- Green monospace terminal text
- CRT scanline effects
- 1980s computer aesthetics
- Retro boot sequence
- Authentic terminal interactions

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy

### Other Platforms
Ensure your deployment platform supports:
- Node.js runtime
- Environment variables
- Next.js 15+ features

## 🔒 Security

### Dependency Management
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix security issues
npm audit fix
```

### Automated Security
- **GitHub Actions**: Automated vulnerability scanning on pushes and PRs
- **Weekly Audits**: Scheduled security checks every Monday
- **Dependency Updates**: Monthly automated dependency update PRs
- **Secret Scanning**: Prevents client-side exposure of API keys

### Best Practices
- ✅ API keys stored in `.env.local` (server-side only)
- ✅ No `NEXT_PUBLIC_` variables with sensitive data
- ✅ Input validation on all endpoints
- ✅ Rate limiting on API routes
- ✅ Secure headers and CSP
- ✅ Anonymized logging

**Security Workflow Files**:
- `.github/workflows/security-audit.yml` - Vulnerability scanning
- `.github/workflows/dependency-update.yml` - Automated updates

---

*"Shall we play a game?"* - ECHO 