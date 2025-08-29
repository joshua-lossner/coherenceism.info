const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');

// Verify Ivy persona in system prompt

test('conversation context uses Ivy persona', async () => {
  const content = await fs.readFile('lib/conversation-context.ts', 'utf-8');
  assert.ok(content.includes('Ivy'));
  assert.ok(content.includes('spiritually attuned'));
  assert.ok(content.includes('Coherenceism'));
});
