import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import OpenAI from 'openai'
import matter from 'gray-matter'
import { CHAT_MODEL, FALLBACK_CHAT_MODEL } from '../../../../lib/models'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_token')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // allow empty body and default type
  }
  const type = typeof body?.type === 'string' && body.type ? String(body.type) : 'news'

  // Assemble prompt stack
  const loadText = async (p: string) => (await fetch(new URL(`/../${p}`, request.url)).then(() => null).catch(() => null), null)
  // For simplicity, inline static reads via require(). In Next edge this is limited; here we use Node runtime.
  const fs = await import('fs/promises')
  const path = await import('path')
  const root = process.cwd()
  const readLocal = async (rel: string) => {
    try { return await fs.readFile(path.resolve(root, rel), 'utf8') } catch { return '' }
  }
  const intent = await readLocal('prompts/00-intent.md')
  const domain = await readLocal('prompts/10-domain-context.md')
  const data = await readLocal('prompts/20-data-inputs.md')
  const researcher = await readLocal('prompts/30-actors/researcher.md')
  const analyst = await readLocal('prompts/30-actors/analyst.md')
  const writer = await readLocal('prompts/30-actors/writer.md')
  const qa = await readLocal('prompts/30-actors/qa.md')
  const outContract = await readLocal('prompts/40-output-contracts/news_brief.md')
  const qaGate = await readLocal('prompts/50-gates/qa.md')

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return SecurityHeadersManager.createErrorResponse('OPENAI_API_KEY missing', 500)
  const client = new OpenAI({ apiKey })

  const call = async (sys: string, user: string) => {
    try {
      const r = await client.chat.completions.create({ model: CHAT_MODEL, messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ], temperature: 0.7, max_tokens: 1200 })
      return r.choices[0]?.message?.content || ''
    } catch {
      const r = await client.chat.completions.create({ model: FALLBACK_CHAT_MODEL, messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ], temperature: 0.7, max_tokens: 1200 })
      return r.choices[0]?.message?.content || ''
    }
  }

  const orchestratorHeader = 'You are the orchestrator. Assemble the stack from provided sections. Refuse if sections are missing.'
  const common = `${intent}\n\n${domain}\n\n${data}`

  // Stage 1: Researcher
  const researchPrompt = `${common}\n\n${researcher}\n\nReturn a 10-bullet brief with URLs.`
  const research = await call(orchestratorHeader, researchPrompt)

  // Stage 2: Analyst
  const analystPrompt = `${common}\n\n${analyst}\n\nUse research:\n${research}`
  const analysis = await call(orchestratorHeader, analystPrompt)

  // Stage 3: Writer
  const writerPrompt = `${common}\n\n${writer}\n\nOutput contract:\n${outContract}\n\nUse outline:\n${analysis}`
  const draft = await call(orchestratorHeader, writerPrompt)

  // Stage 4: QA
  const qaPrompt = `${common}\n\n${qa}\n\nQA Gate:\n${qaGate}\n\nDraft:\n${draft}\n\nReturn either APPROVED or a remediation checklist.`
  const qaResult = await call(orchestratorHeader, qaPrompt)

  // Parse and normalize YAML frontmatter
  const parsed = matter(draft)
  const fm = { ...(parsed.data || {}), published: false, type: 'news', prompt_version: 'v0.1' }
  const mdOut = matter.stringify(parsed.content || '', fm)

  // Compute slug and path
  const title = (fm as any).title || 'daily-news-brief'
  const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const relPath = `content/generated/${type}/${slug}.md`
  const repo = 'joshua-lossner/coherenceism.content'
  const ghToken = process.env.GITHUB_TOKEN
  const ref = process.env.CONTENT_REF || 'main'
  if (!ghToken) return SecurityHeadersManager.createErrorResponse('GITHUB_TOKEN not configured', 500)

  // Read existing (if any) to get sha
  let sha: string | undefined
  const headers = { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'coherenceism-admin' } as const
  const getResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(relPath)}?ref=${encodeURIComponent(ref)}`, { headers, cache: 'no-store' })
  if (getResp.ok) {
    const j: any = await getResp.json()
    sha = j?.sha
  }
  const contentB64 = Buffer.from(mdOut, 'utf8').toString('base64')
  const putResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(relPath)}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Generate daily brief: ${slug}`, content: contentB64, sha }) })
  if (!putResp.ok) {
    const errText = await putResp.text().catch(() => '')
    return SecurityHeadersManager.createErrorResponse(`GitHub commit failed (${putResp.status}): ${errText || 'Unknown error'}`, 502)
  }

  const res = NextResponse.json({ message: `Generated Daily News Brief: ${title}`, id: Buffer.from(relPath).toString('base64'), qa: qaResult.substring(0, 500) })
  SecurityHeadersManager.applyToResponse(res)
  return res
}


