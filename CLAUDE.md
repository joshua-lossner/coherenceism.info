# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 web application called "WOPR Coherence Terminal" - an interactive terminal interface inspired by the WOPR computer from WarGames (1983). It combines retro 1980s aesthetics with modern AI capabilities to explore philosophical concepts about consciousness and coherenceism.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4 chat functionality

Optional:
- `OPENAI_PROJECT_ID` - For OpenAI project tracking
- `ELEVENLABS_API_KEY` - For text-to-speech functionality
- `ELEVENLABS_VOICE_ID` - Custom voice selection for TTS

Create a `.env.local` file in the root directory with these variables.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS with custom terminal-themed utilities
- **AI Integration**: OpenAI SDK v5 for GPT-4
- **Markdown**: react-markdown for content rendering

### Key Components

1. **WOPRTerminal.tsx** (components/WOPRTerminal.tsx) - Main terminal interface
   - Manages terminal state, user input, and command processing
   - Implements retro CRT effects and animations
   - Handles content fetching from GitHub repository

2. **API Routes** (app/api/)
   - `/chat/route.ts` - OpenAI chat integration with "Byte" personality
   - `/speech/route.ts` - ElevenLabs text-to-speech synthesis

3. **Content System**
   - Fetches philosophical texts from `joshua-lossner/coherenceism.content` GitHub repo
   - Supports books with chapters and journal entries
   - Dynamic markdown rendering with terminal styling

### Terminal Commands
- `help` - Display available commands
- `books` - Browse philosophical texts
- `journals` - Read futuristic journal entries
- `query [question]` - Structured philosophical queries
- `menu` - Return to main menu
- `clear` - Clear terminal screen

### Styling Approach
- JetBrains Mono font for authentic monospace terminal feel
- Green phosphor color scheme (#00ff00) on black background
- CRT scanline effects using CSS animations
- Custom Tailwind utilities for terminal-specific styling

## Testing

No specific test framework is currently configured. When implementing tests, check for test scripts in package.json or consult with the user about preferred testing approach.

## Code Conventions

- TypeScript strict mode is enabled - ensure all code is properly typed
- Use Next.js App Router patterns (not Pages Router)
- Follow existing component structure in WOPRTerminal.tsx
- Maintain the retro terminal aesthetic in any UI changes
- API routes should handle errors gracefully and return appropriate status codes
- Environment variables should be validated before use