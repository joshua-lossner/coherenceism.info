// Shared types for orchestrator and API stubs
// TODO: Extend with richer metadata as stages are implemented

export type ActorName =
  | 'researcher'
  | 'analyst'
  | 'writer'
  | 'qa'
  | 'extractor'
  | 'arranger'
  | 'diff'
  | 'planner'
  | 'evaluator'

export type WorkflowName =
  | 'daily-brief'
  | 'journal-from-conversation'
  | 'code-rag-maintenance'

export type OutputKind = 'journal' | 'news_brief' | 'tech_note'

export interface FrontMatter {
  title: string
  slug: string
  published: boolean
  type: OutputKind
  tags?: string[]
  sources?: string[]
  summary?: string
  // Allow future fields without breaking the contract
  [k: string]: unknown
}

export interface Artifact {
  frontMatter: FrontMatter
  body: string
  qa: { passed: boolean; notes: string[] }
}

export interface OrchestratorInput {
  workflow: WorkflowName
  intentSpec: string
  overrides?: Partial<FrontMatter>
}

export interface OrchestratorResult {
  artifact: Artifact
  logs: string[]
}


