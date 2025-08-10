import { NextRequest, NextResponse } from 'next/server'
import { runWorkflow } from '../../../../lib/orchestrator'
import type { OrchestratorInput, WorkflowName } from '../../../../lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { workflow, intentSpec, overrides } = body as Partial<OrchestratorInput>

    if (!workflow || typeof workflow !== 'string') {
      return NextResponse.json({ error: 'Invalid workflow' }, { status: 400 })
    }
    if (!intentSpec || typeof intentSpec !== 'string') {
      return NextResponse.json({ error: 'Invalid intentSpec' }, { status: 400 })
    }

    const input: OrchestratorInput = {
      workflow: workflow as WorkflowName,
      intentSpec,
      overrides: overrides ?? undefined,
    }

    const result = await runWorkflow(input)
    return NextResponse.json({ artifact: result.artifact, logs: result.logs })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Bad Request' }, { status: 400 })
  }
}

export const runtime = 'nodejs'


