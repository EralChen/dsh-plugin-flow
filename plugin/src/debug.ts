/**
 * Debugger entry point: route a typed prompt to the first live agent.
 * Zero runtime deps — the message is constructed inline (branded ids are
 * plain strings at runtime), so the plugin still links cleanly.
 * @module @dshflow/plugin/debug
 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'

export interface DebugResult {
  ok: boolean
  sessionId?: string
  error?: string
}

/** Send one follow-up prompt to the first live agent. */
export function sendDebugMessage(ctx: Context, text: string): DebugResult {
  const agent = ctx.agents.list()[0]
  if (agent === undefined) {
    return { ok: false, error: 'no active agent — open a session in the web UI first' }
  }
  const trimmed = text.trim()
  if (trimmed === '') {
    return { ok: false, error: 'empty message' }
  }
  const message = {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text: trimmed }],
    source: { kind: 'user' },
  }
  agent.followup(message as Parameters<typeof agent.followup>[0])
  return { ok: true, sessionId: String(agent.id) }
}
