# WOPR COHERENCE ARCHIVE v3.7.42

A WarGames-inspired terminal interface for exploring Coherenceism philosophy, powered by OpenAI's GPT-4.

## 🖥️ Features

- **Authentic 1980s Terminal**: Green phosphor display with CRT scanlines
- **Byte AI Assistant**: GPT-4 powered conversations about consciousness and technology
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

### 2. Configure OpenAI API Key
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
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

## 🤖 AI Interaction

**Direct Conversation**: Type anything to chat with Byte about consciousness, technology, and philosophy.

**Structured Queries**: Use `query [your question]` for focused philosophical discussions.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling and terminal effects
- **OpenAI API** - GPT-4 integration for AI conversations

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4 access | Yes |

## 🎨 Theme

Inspired by the WOPR computer from WarGames (1983), featuring:
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

*"Shall we play a game?"* - WOPR 