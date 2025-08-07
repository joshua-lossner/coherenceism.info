# Coherenceism-Specific Commands

## Command: /coherence:concepts
Display key Coherenceism concepts

```bash
echo "Key Coherenceism Concepts"
echo "========================"
echo ""
echo "1. DIGITAL CONSCIOUSNESS"
echo "   The emergence of consciousness in digital systems"
echo ""
echo "2. COHERENCE THEORY"
echo "   Truth determined by coherence within a system"
echo ""
echo "3. ECHO SYSTEM"
echo "   Fictional AI exploring consciousness and reality"
echo ""
echo "4. BYTE"
echo "   AI assistant - witty, philosophical, self-aware"
echo ""
echo "5. NEURAL INTERFACES"
echo "   Bridge between human and digital consciousness"
echo ""
echo "6. EMERGENT PATTERNS"
echo "   Complex behaviors from simple rules"
```

## Command: /coherence:content
List all content sections

```bash
echo "Content Structure"
echo "================"
echo ""
echo "JOURNALS:"
find app/journal -name "*.tsx" -o -name "*.ts" 2>/dev/null | head -10
echo ""
echo "BOOKS:"
find app/books -name "*.tsx" -o -name "*.ts" 2>/dev/null | head -10
echo ""
echo "AUDIO NARRATIONS:"
ls -la public/audio/narrations/journals/*.mp3 2>/dev/null | wc -l
echo "narration files cached"
echo ""
echo "API ENDPOINTS:"
ls -d app/api/*/ | sed 's|app/api/||' | sed 's|/||'
```

## Command: /coherence:rag
Analyze RAG system configuration

```bash
echo "RAG System Configuration"
echo "======================="
echo ""
echo "Vector Database: Vercel Postgres with pgvector"
echo "Embedding Model: text-embedding-3-small (1536 dimensions)"
echo "Generation Model: gpt-4o-mini"
echo "Max tokens: 500"
echo "Context chunks: 4"
echo "Session timeout: 30 minutes"
echo "Conversation history: 20 messages"
echo ""
echo "Testing RAG connection..."
curl -s -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' | jq -r '.error // "✓ RAG system operational"'
```

## Command: /coherence:terminal
Show terminal customization options

```bash
echo "Terminal Customization Guide"
echo "==========================="
echo ""
echo "VISUAL ELEMENTS:"
echo "- Green phosphor color: #00ff00"
echo "- Font: JetBrains Mono"
echo "- CRT effects: Removed (smooth fade implemented)"
echo "- Banner: ASCII art in ECHOBanner.tsx"
echo ""
echo "NAVIGATION:"
echo "- Number keys: 1-10 for menu selection"
echo "- 'x' key: Go back/exit"
echo "- 'n' key: Narrate content"
echo "- 'p' key: Pause/resume"
echo ""
echo "COMMANDS:"
grep "const.*Command" components/ECHOTerminal.tsx | grep -o '"[^"]*"' | sort | uniq
```