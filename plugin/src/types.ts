/**
 * Wire contract for the visualization. This is the canonical shape served by
 * the JSON/SSE endpoints and consumed by the Vue frontend.
 * @module dshflow/types
 */

/** Cordis `FiberState` values, as strings (the enum is a const enum). */
export type DshFlowState =
  | 'pending'
  | 'loading'
  | 'active'
  | 'failed'
  | 'disposed'
  | 'unloading'

/** One plugin fiber in the live Cordis tree. */
export interface DshFlowNode {
  /**
   * Fiber uid as a string. Stable within the process and unique across fibers;
   * reserved as the addressing key for the future runtime-control layer (v2).
   * The root fiber is `'0'`.
   */
  id: string
  /** Plugin display name (`runtime.name`), or `'root'` for the root fiber. */
  name: string
  /** Lifecycle state of this fiber. */
  state: DshFlowState
  /** Services provided by this fiber's subtree, sorted. */
  provides: string[]
  /** Services declared in this fiber's `inject`. */
  inject: string[]
  /** Mounted child fibers. */
  children: DshFlowNode[]
}

/** One live `ctx.<key>` service and its owning fiber. */
export interface DshFlowService {
  /** Service name (`ctx.<key>`). */
  name: string
  /** Display name of the fiber providing it. */
  owner: string
  /** Lifecycle state of the owning fiber. */
  state: DshFlowState
}

/** Complete snapshot of the running plugin tree. */
export interface DshFlowTree {
  /** ISO timestamp of when the snapshot was taken. */
  generatedAt: string
  /** The root of the fiber tree. */
  root: DshFlowNode
  /** Every live service registration. */
  services: DshFlowService[]
}
