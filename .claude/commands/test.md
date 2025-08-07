# Testing Commands

## Command: /test:api
Test all API endpoints

```bash
echo "Testing Chat API..."
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Byte", "mode": "conversation"}' | jq .

echo -e "\nTesting Search API..."
curl -s "http://localhost:3000/api/search?q=consciousness" | jq .

echo -e "\nTesting RAG API..."
curl -s -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"message": "What is digital consciousness?"}' | jq .

echo -e "\nAPI tests complete!"
```

## Command: /test:terminal
Test terminal navigation commands

```bash
echo "Terminal Command Test Checklist:"
echo "================================"
echo "1. Test number navigation (1-10)"
echo "2. Test 'x' to go back"
echo "3. Test /menu command"
echo "4. Test /help command"
echo "5. Test /clear command"
echo "6. Test /random command"
echo "7. Test /voice toggle"
echo "8. Test narration with 'n'"
echo "9. Test pause with 'p'"
echo "10. Test chat interaction"
echo ""
echo "Open http://localhost:3000 to begin testing"
```

## Command: /test:audio
Test audio narration system

```bash
echo "Testing audio narration..."
TEST_TEXT="This is a test of the ECHO audio narration system. Byte speaks with clarity and purpose."
TEST_ID="test-$(date +%s)"

curl -s -X POST http://localhost:3000/api/narrate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"contentId\": \"$TEST_ID\"}" | jq .

echo "Audio narration test complete!"
echo "Check response for audio URLs"
```

## Command: /test:security
Run security checks

```bash
echo "Running security audit..."
npm audit

echo -e "\nChecking for exposed secrets..."
grep -r "OPENAI_API_KEY\|ELEVENLABS_API_KEY\|POSTGRES_URL\|BLOB_READ_WRITE_TOKEN" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.md" \
  app/ components/ lib/ 2>/dev/null || echo "No exposed secrets found"

echo -e "\nSecurity check complete!"
```