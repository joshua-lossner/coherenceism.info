# ECHO COHERENCE ARCHIVE

A WarGames-inspired terminal interface for exploring Coherenceism philosophy, powered by OpenAI's GPT-4.

## 🖥️ Features

- **Authentic 1980s Terminal**: Green phosphor display with CRT scanlines
- **Byte AI Assistant**: GPT-4 powered conversations about consciousness and technology
- **Audio Narration**: Byte narrates all content with intelligent caching and seamless playback
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
- `/random` - Receive a random Byte-generated thought or humorous quip
- `/voice` - Toggle audio output (Byte speaks responses aloud)
- `/clear` - Clear terminal screen

### Content Navigation Commands
When viewing journal entries or book chapters:
- `n` or `n.` - Narrate current content (Byte reads it aloud)
- `p` or `p.` - Pause/resume narration

## 🤖 AI Interaction

**Direct Conversation**: Type anything to chat with Byte about consciousness, technology, and philosophy.

**Structured Queries**: Use `query [your question]` for focused philosophical discussions.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling and terminal effects
- **OpenAI API** - GPT-4 integration for AI conversations
- **ElevenLabs API** - High-quality text-to-speech for audio narration

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4 access | Yes |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key for audio narration | Yes |
| `BLOB_READ_WRITE_TOKEN` | Your Vercel Blob token for audio file storage | Yes |
| `GITHUB_TOKEN` | GitHub personal access token for changelog (increases API rate limit) | No |

## 🎧 Audio Narration System

The audio narration feature allows Byte to read journal entries and book chapters aloud using ElevenLabs' advanced text-to-speech technology.

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
- Next.js 14 features

---

*"Shall we play a game?"* - ECHO 