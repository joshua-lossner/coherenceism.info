# Claude Code Integration Guide

## Quick Start

This project has been optimized for Claude Code. The CLAUDE.md file contains comprehensive context about the project architecture, conventions, and patterns.

## Available Custom Commands

### Development
- `/dev:start` - Start development server
- `/dev:build` - Build for production
- `/dev:lint` - Run linting and type checking
- `/dev:clean` - Clean build artifacts

### Testing
- `/test:api` - Test all API endpoints
- `/test:terminal` - Test terminal navigation
- `/test:audio` - Test audio narration
- `/test:security` - Run security checks

### Analysis
- `/analyze:performance` - Bundle size analysis
- `/analyze:deps` - Dependency analysis
- `/analyze:code` - Code complexity metrics
- `/analyze:terminal` - Terminal component analysis

### Deployment
- `/deploy:preview` - Create preview deployment
- `/deploy:production` - Production deployment guide
- `/deploy:rollback` - Rollback instructions
- `/deploy:env` - Environment variable check

### Coherenceism
- `/coherence:concepts` - Display key concepts
- `/coherence:content` - List content structure
- `/coherence:rag` - RAG system configuration
- `/coherence:terminal` - Terminal customization

## Key Files for Claude

When working with Claude Code, these are the most important files:

1. **CLAUDE.md** - Complete project context and documentation
2. **components/ECHOTerminal.tsx** - Main terminal interface
3. **app/api/*** - All API endpoints
4. **lib/** - Utility functions and helpers

## Common Claude Code Workflows

### Adding a New Terminal Command
1. Edit `components/ECHOTerminal.tsx`
2. Find the `handleCommand` function
3. Add your new command case
4. Test with `npm run dev`

### Modifying AI Behavior
1. Edit `app/api/chat/route.ts`
2. Modify the system prompt
3. Test with curl or browser

### Adding New Content
1. Add content files to appropriate directory
2. Update navigation in `ECHOTerminal.tsx`
3. Test navigation flow

### Updating Styles
1. Edit `app/globals.css` for global styles
2. Use Tailwind classes in components
3. Maintain terminal aesthetic

## Best Practices for Claude Code

1. **Use TodoWrite** for complex tasks with multiple steps
2. **Test locally** with `npm run dev` before committing
3. **Follow TypeScript patterns** - the project uses strict mode
4. **Maintain terminal aesthetic** - green phosphor, monospace font
5. **Keep security in mind** - never expose API keys client-side
6. **Use existing utilities** in `lib/` directory
7. **Test API changes** with the `/test:api` command

## Project-Specific Context

This is a philosophy exploration terminal about Coherenceism, featuring:
- **Byte**: An AI assistant character (witty, philosophical)
- **ECHO System**: The fictional AI system framework
- **Terminal Interface**: 1980s WarGames-inspired design
- **RAG System**: Vector search for contextual responses
- **Audio Narration**: Text-to-speech with caching

## Environment Setup

Ensure `.env.local` contains:
```bash
OPENAI_API_KEY=your_key
POSTGRES_URL=your_postgres_url
ELEVENLABS_API_KEY=your_elevenlabs_key
BLOB_READ_WRITE_TOKEN=your_blob_token
```

## Troubleshooting

### Development Server Issues
Run `/dev:clean` then `npm install`

### TypeScript Errors
Run `/dev:lint` to identify issues

### API Not Responding
Check environment variables with `/deploy:env`

### Audio Not Working
Verify ElevenLabs API key is set

## Getting Help

- Check CLAUDE.md for detailed documentation
- Use `/analyze:code` to understand structure
- Review existing patterns in codebase
- Test changes incrementally