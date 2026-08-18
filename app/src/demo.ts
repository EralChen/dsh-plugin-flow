/**
 * Fixture used when no dsh backend is reachable (`pnpm app:dev` standalone).
 * Mirrors a small slice of `dsh-base` + `dsh-web-app`.
 */
import type { DshFlowNode, DshFlowTree } from '@dshflow/shared/types/dsh-flow'

let seq = 0
function node(
  name: string,
  children: DshFlowNode[] = [],
  state: DshFlowNode['state'] = 'active',
  provides: string[] = [],
  inject: string[] = [],
): DshFlowNode {
  seq += 1
  return { id: String(seq), name, state, provides, inject, children }
}

const baseChildren = [
  node('@deepseek-ai/dsh-llm', [], 'active', ['llm']),
  node('@deepseek-ai/dsh-session', [], 'active', ['sessions']),
  node('@deepseek-ai/dsh-agent', [], 'active', ['agents']),
  node('@deepseek-ai/dsh-agent-loop', [], 'active', ['agentLoop'], ['agents']),
  node('@deepseek-ai/dsh-tools', [], 'active', ['tools']),
  node('@deepseek-ai/dsh-system-prompt', [], 'active', ['systemPrompt']),
  node('@deepseek-ai/dsh-llm-deepseek', [], 'active', [], ['llm']),
  node('@deepseek-ai/dsh-sandbox-local', [], 'active', ['sandbox']),
  node('@deepseek-ai/dsh-user-approval', [], 'active', ['approval']),
  node('@deepseek-ai/dsh-tool-bash', [], 'loading', [], ['tools']),
  node('@deepseek-ai/dsh-tool-fs', [], 'active', [], ['tools']),
  node('@deepseek-ai/dsh-tool-web', [], 'active', [], ['tools']),
]

const webChildren = [
  node('@deepseek-ai/dsh-host-webserver', [], 'active', ['webServer']),
  node('@deepseek-ai/dsh-web-app', [], 'active', ['webRuntime'], ['webServer']),
  node('@deepseek-ai/dsh-client-runtime', [], 'active', [], ['webServer']),
  node('@deepseek-ai/dsh-client-ui-conversation', [], 'active'),
]

export const demoTree: DshFlowTree = {
  generatedAt: new Date().toISOString(),
  root: node('root', [
    node('@deepseek-ai/dsh-base', baseChildren, 'active', [], []),
    node('@deepseek-ai/dsh-web-app', webChildren, 'active', [], []),
    node('dshflow', [], 'active', [], ['webServer']),
  ]),
  services: [
    { name: 'llm', owner: '@deepseek-ai/dsh-llm', state: 'active' },
    { name: 'sessions', owner: '@deepseek-ai/dsh-session', state: 'active' },
    { name: 'agents', owner: '@deepseek-ai/dsh-agent', state: 'active' },
    { name: 'webServer', owner: '@deepseek-ai/dsh-host-webserver', state: 'active' },
  ],
}
