/**
 * Frontend mirror of the plugin's wire contract (`plugin/src/types.ts`).
 * Keep these two files in sync; extracting a shared package is deferred work.
 */

export type DshFlowState =
  | 'pending'
  | 'loading'
  | 'active'
  | 'failed'
  | 'disposed'
  | 'unloading'

export interface DshFlowNode {
  /** Fiber uid as string; `'0'` is the root. Reserved for v2 control. */
  id: string
  name: string
  state: DshFlowState
  anonymous?: boolean
  /**
   * Explicit presentation category id (set by client-side projections);
   * overrides `categorize(name)`.
   */
  categoryId?: string
  provides: string[]
  inject: string[]
  config?: unknown
  children: DshFlowNode[]
}

export interface ServiceSummary {
  type: string
  ctor?: string
  keys?: string[]
}

export interface DshFlowService {
  name: string
  owner: string
  state: DshFlowState
  summary?: ServiceSummary
}

export interface DshFlowServiceDetail {
  name: string
  owner: string
  state: DshFlowState
  value: unknown
}

export interface DshFlowTree {
  generatedAt: string
  root: DshFlowNode
  services: DshFlowService[]
}

/** Presentation metadata for one plugin category. */
export interface DshFlowCategory {
  id: string
  label: string
  /** Accent color used by the node renderer. */
  color: string
}
