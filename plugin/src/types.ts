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
  /**
   * True when this fiber has no runtime name of its own (`ctx.inject()` /
   * anonymous `ctx.plugin()` registrations). Its `name` is then inherited from
   * the nearest named ancestor; the UI folds these away.
   */
  anonymous?: boolean
  /** Services provided by this fiber's subtree, sorted. */
  provides: string[]
  /** Services declared in this fiber's `inject`. */
  inject: string[]
  /** Safe projection of this fiber's validated `config` (depth/length capped). */
  config?: unknown
  /** Mounted child fibers. */
  children: DshFlowNode[]
}

/** Safe summary of a live service value (never the raw object). */
export interface ServiceSummary {
  /** `typeof` of the value. */
  type: string
  /** Constructor name for object values. */
  ctor?: string
  /** Own enumerable keys, capped. */
  keys?: string[]
}

/** One live `ctx.<key>` service and its owning fiber. */
export interface DshFlowService {
  /** Service name (`ctx.<key>`). */
  name: string
  /** Display name of the fiber providing it. */
  owner: string
  /** Lifecycle state of the owning fiber. */
  state: DshFlowState
  /** Safe summary of the current service value. */
  summary?: ServiceSummary
}

/** Deeper projection of one specific service's value (opt-in, per name). */
export interface DshFlowServiceDetail {
  name: string
  owner: string
  state: DshFlowState
  /** Safe serialization of the service value, with a deeper budget than the tree snapshot. */
  value: unknown
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
