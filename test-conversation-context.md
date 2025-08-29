# Ivy Conversation Context Test Plan

## Test Scenarios

### 1. Basic Context Retention
1. Start conversation: "Hi Ivy, my name is Joshua"
2. Follow up: "What's my name?"
3. Expected: Ivy should remember the name

### 2. Multi-turn Conversation
1. "I love pizza"
2. "What's your favorite food?"
3. "What did I say I loved?"
4. Expected: Ivy should reference both pizza preferences

### 3. Context Persistence
1. Have a conversation
2. Navigate to different menus
3. Return and continue conversation
4. Expected: Context should be maintained

### 4. Reset Command
1. Have a conversation with context
2. Use `/reset` command
3. Ask about previous conversation
4. Expected: Ivy should not remember previous context

### 5. Session Timeout
1. Have a conversation
2. Wait 30+ minutes
3. Continue conversation
4. Expected: New session should start

### 6. Query Mode vs Conversation Mode
1. Use `/random` (query mode)
2. Have regular conversation
3. Expected: Random queries shouldn't affect conversation context

## Implementation Notes
- Context persisted to disk for session continuity
- Summaries generated when history grows too large
- 30-minute session timeout
- Last 20 messages retained after summarization
- Session cookie used for tracking