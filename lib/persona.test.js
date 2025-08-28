import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'

// Verify Ivy persona in system prompt

test('conversation context uses Ivy persona', async () => {
  const content = await fs.readFile('lib/conversation-context.ts', 'utf-8')
  assert.ok(content.includes('Ivy'))
  assert.ok(content.includes('spiritually attuned'))
})
