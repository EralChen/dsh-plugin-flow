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
  provides: string[]
  inject: string[]
  children: DshFlowNode[]
}

export interface DshFlowService {
  name: string
  owner: string
  state: DshFlowState
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
