/**
 * Plugin catalog: maps every `@deepseek-ai/dsh-*` (and `cordis-plugin-*`)
 * package name to a presentation category. The runtime tree only carries
 * names; the frontend owns this name → category → color mapping.
 *
 * `nodeType` is intentionally reserved: when per-plugin node components land
 * (one `DshNode<Plugin>` per plugin), each category row can pin the exact
 * node type here without touching the tree wire format.
 * @module @dshflow/shared/catalog
 */

import type { DshFlowCategory } from './types/dsh-flow'

export const CATEGORIES = {
  bundle: { id: 'bundle', label: 'Bundle / Profile', color: '#7c3aed' },
  core: { id: 'core', label: 'Core / Host', color: '#64748b' },
  llm: { id: 'llm', label: 'LLM / Model', color: '#2563eb' },
  agent: { id: 'agent', label: 'Agent / Loop', color: '#8b5cf6' },
  session: { id: 'session', label: 'Session', color: '#0ea5e9' },
  tools: { id: 'tools', label: 'Tools', color: '#f59e0b' },
  'system-prompt': { id: 'system-prompt', label: 'System Prompt', color: '#14b8a6' },
  skill: { id: 'skill', label: 'Skill', color: '#10b981' },
  fs: { id: 'fs', label: 'Filesystem', color: '#84cc16' },
  sandbox: { id: 'sandbox', label: 'Sandbox / Runtime', color: '#f97316' },
  permission: { id: 'permission', label: 'Permission / Approval', color: '#ef4444' },
  goal: { id: 'goal', label: 'Goal', color: '#ec4899' },
  plan: { id: 'plan', label: 'Plan Mode', color: '#a855f7' },
  subagent: { id: 'subagent', label: 'Sub-agent', color: '#06b6d4' },
  workflow: { id: 'workflow', label: 'Workflow', color: '#6366f1' },
  web: { id: 'web', label: 'Web / Search', color: '#3b82f6' },
  'client-ui': { id: 'client-ui', label: 'Client UI', color: '#22d3ee' },
  command: { id: 'command', label: 'Commands', color: '#eab308' },
  settings: { id: 'settings', label: 'Settings / Credentials', color: '#94a3b8' },
  telemetry: { id: 'telemetry', label: 'Telemetry / Meter', color: '#f43f5e' },
  compaction: { id: 'compaction', label: 'Compaction / Spill', color: '#d946ef' },
  storage: { id: 'storage', label: 'Storage', color: '#65a30d' },
  terminal: { id: 'terminal', label: 'Shell / Terminal', color: '#1f2937' },
  jobs: { id: 'jobs', label: 'Jobs', color: '#fb923c' },
  mcp: { id: 'mcp', label: 'MCP', color: '#0891b2' },
  lsp: { id: 'lsp', label: 'LSP', color: '#4f46e5' },
  other: { id: 'other', label: 'Other', color: '#9ca3af' },
} as const satisfies Record<string, DshFlowCategory>

export type CategoryId = keyof typeof CATEGORIES

/** Exact-name overrides (most tool-* packages diverge from the `dsh-tool-` default). */
const OVERRIDES: Record<string, CategoryId> = {
  '@deepseek-ai/dsh-tools': 'tools',
  '@deepseek-ai/dsh-tool-bash': 'terminal',
  '@deepseek-ai/dsh-tool-pwsh': 'terminal',
  '@deepseek-ai/dsh-tool-terminal': 'terminal',
  '@deepseek-ai/dsh-tool-fs': 'fs',
  '@deepseek-ai/dsh-tool-fs-search': 'fs',
  '@deepseek-ai/dsh-tool-session-query': 'session',
  '@deepseek-ai/dsh-tool-skill': 'skill',
  '@deepseek-ai/dsh-tool-goal': 'goal',
  '@deepseek-ai/dsh-tool-subagent': 'subagent',
  '@deepseek-ai/dsh-tool-subagent-control': 'subagent',
  '@deepseek-ai/dsh-tool-subagent-report': 'subagent',
  '@deepseek-ai/dsh-tool-ralph': 'subagent',
  '@deepseek-ai/dsh-tool-workflow': 'workflow',
  '@deepseek-ai/dsh-tool-web': 'web',
  '@deepseek-ai/dsh-tool-jobs': 'jobs',
  '@deepseek-ai/dsh-tool-lsp': 'lsp',
  '@deepseek-ai/dsh-tool-ask-user': 'permission',
  '@deepseek-ai/dsh-tool-cordis': 'core',
  '@deepseek-ai/dsh-tool-todo': 'tools',
  '@deepseek-ai/dsh-tool-str-replace-editor': 'tools',
}

/** Ordered prefix rules; first match wins. Order matters. */
const RULES: Array<[RegExp, CategoryId]> = [
  [/^@deepseek-ai\/cordis-plugin-/, 'core'],
  [/^@deepseek-ai\/dsh-typert/, 'core'],
  [/^@deepseek-ai\/dsh-api-/, 'core'],
  [/^@deepseek-ai\/dsh-host-/, 'core'],
  [/^@deepseek-ai\/dsh-cordis-/, 'core'],
  [/^@deepseek-ai\/dsh-llm/, 'llm'],
  [/^@deepseek-ai\/dsh-agent/, 'agent'],
  [/^@deepseek-ai\/dsh-session/, 'session'],
  [/^@deepseek-ai\/dsh-attachment/, 'session'],
  [/^@deepseek-ai\/dsh-message-feedback/, 'session'],
  [/^@deepseek-ai\/dsh-workspace/, 'fs'],
  [/^@deepseek-ai\/dsh-storage/, 'storage'],
  [/^@deepseek-ai\/dsh-fs/, 'fs'],
  [/^@deepseek-ai\/dsh-sandbox/, 'sandbox'],
  [/^@deepseek-ai\/dsh-bash/, 'terminal'],
  [/^@deepseek-ai\/dsh-pwsh/, 'terminal'],
  [/^@deepseek-ai\/dsh-terminal/, 'terminal'],
  [/^@deepseek-ai\/dsh-shell/, 'terminal'],
  [/^@deepseek-ai\/dsh-subprocess/, 'sandbox'],
  [/^@deepseek-ai\/dsh-code-runtime/, 'sandbox'],
  [/^@deepseek-ai\/dsh-e2b/, 'sandbox'],
  [/^@deepseek-ai\/dsh-permission/, 'permission'],
  [/^@deepseek-ai\/dsh-user-approval/, 'permission'],
  [/^@deepseek-ai\/dsh-user-questions/, 'permission'],
  [/^@deepseek-ai\/dsh-credentials/, 'settings'],
  [/^@deepseek-ai\/dsh-settings/, 'settings'],
  [/^@deepseek-ai\/dsh-telemetry/, 'telemetry'],
  [/^@deepseek-ai\/dsh-token-meter/, 'telemetry'],
  [/^@deepseek-ai\/dsh-compaction/, 'compaction'],
  [/^@deepseek-ai\/dsh-spill/, 'compaction'],
  [/^@deepseek-ai\/dsh-goal/, 'goal'],
  [/^@deepseek-ai\/dsh-plan/, 'plan'],
  [/^@deepseek-ai\/dsh-subagent/, 'subagent'],
  [/^@deepseek-ai\/dsh-workflow/, 'workflow'],
  [/^@deepseek-ai\/dsh-web/, 'web'],
  [/^@deepseek-ai\/dsh-mcp/, 'mcp'],
  [/^@deepseek-ai\/dsh-lsp/, 'lsp'],
  [/^@deepseek-ai\/dsh-jobs/, 'jobs'],
  [/^@deepseek-ai\/dsh-skill/, 'skill'],
  [/^@deepseek-ai\/dsh-system-prompt/, 'system-prompt'],
  [/^@deepseek-ai\/dsh-tool-/, 'tools'],
  [/^@deepseek-ai\/dsh-command/, 'command'],
  [/^@deepseek-ai\/dsh-client-ui-/, 'client-ui'],
  [/^@deepseek-ai\/dsh-client-/, 'client-ui'],
  [/^@deepseek-ai\/dsh-ui-/, 'client-ui'],
  [/^@deepseek-ai\/dsh-headless/, 'bundle'],
  [/^@deepseek-ai\/dsh-web-app/, 'bundle'],
  [/^@deepseek-ai\/dsh-base/, 'bundle'],
]

/** Resolve a plugin name to its presentation category. */
export function categorize(name: string): DshFlowCategory {
  const override = OVERRIDES[name]
  if (override !== undefined) return CATEGORIES[override]
  for (const [pattern, id] of RULES) {
    if (pattern.test(name)) return CATEGORIES[id]
  }
  return CATEGORIES.other
}

/** A plugin name's node type is currently uniform; reserved for per-plugin nodes. */
export function nodeTypeOf(name: string): string {
  return `dsh-node-${categorize(name).id}`
}
