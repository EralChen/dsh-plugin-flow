/**
 * Read-only introspection of the live Cordis runtime: fibers, their parent/
 * child mount tree, and the service registry.
 *
 * The facts come from two runtime mirrors:
 * - `ctx.registry` — every registered plugin runtime and its live fibers.
 * - `ctx.reflect.store` — every provided service (`Impl` records) and its
 *   owning fiber.
 *
 * Nothing here mutates the runtime. Fiber uids are preserved so a later
 * control layer (v2) can address a specific fiber by `id`.
 * @module dshflow/tree
 */

import type { Context, Fiber } from '@deepseek-ai/cordis'
import type { DshFlowNode, DshFlowService, DshFlowServiceDetail, DshFlowState, DshFlowTree, ServiceSummary } from './types'

/** String labels for the cordis `FiberState` const-enum values. */
const STATE_LABELS: Record<number, DshFlowState> = {
  0: 'pending',
  1: 'loading',
  2: 'active',
  3: 'failed',
  4: 'disposed',
  5: 'unloading',
}

function stateOf(fiber: Fiber): DshFlowState {
  return STATE_LABELS[fiber.state] ?? 'pending'
}

/**
 * Project an arbitrary runtime value into a bounded, JSON-safe shape: strings
 * are length-capped, collections are key/entry capped, and cycles/functions/
 * symbols/bigints become markers. Configs are read-only facts; never expose a
 * live object.
 */
function safeSerialize(value: unknown, seen: WeakSet<object> = new WeakSet(), depth = 0, maxDepth = 4): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return value.length > 2000 ? `${value.slice(0, 2000)}…[truncated]` : value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return `[BigInt ${value}]`
  if (typeof value === 'function') return `[Function ${(value as (...args: unknown[]) => unknown).name || 'anonymous'}]`
  if (typeof value === 'symbol') return '[Symbol]'
  if (depth >= maxDepth) return '[MaxDepth]'

  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      const head = value.slice(0, 200).map(item => safeSerialize(item, seen, depth + 1))
      if (value.length > 200) head.push(`[${value.length - 200} more]`)
      return head
    }
    const out: Record<string, unknown> = {}
    const keys = Object.keys(value)
    for (const key of keys.slice(0, 100)) {
      out[key] = safeSerialize((value as Record<string, unknown>)[key], seen, depth + 1)
    }
    if (keys.length > 100) out['[truncated]'] = `${keys.length - 100} more keys`
    return out
  } finally {
    seen.delete(value)
  }
}

/** Summarize a live service value without touching getters or leaking it. */
function summarizeService(value: unknown): ServiceSummary {
  if (value === null || value === undefined) return { type: typeof value }
  const type = typeof value
  if (type !== 'object' && type !== 'function') return { type }
  let ctor: string | undefined
  let keys: string[] | undefined
  try {
    ctor = (value as object).constructor?.name
    keys = Object.keys(value as object).slice(0, 50)
  } catch {
    /* proxies/accessors may throw — stay safe */
  }
  return { type, ctor, keys }
}

/** Every live service implementation record in the reflect store. */
function liveImpls(ctx: Context) {
  const store = ctx.reflect.store
  return Object.getOwnPropertySymbols(store)
    .map(key => store[key])
    .filter((impl): impl is NonNullable<typeof impl> => impl !== undefined)
}

/** Walk to the topmost ancestor fiber (the root, where `parent === self`). */
function findRoot(ctx: Context): Fiber | undefined {
  let fiber = ctx.fiber
  let guard = 0
  while (fiber.parent.fiber !== fiber) {
    fiber = fiber.parent.fiber
    if (++guard > 100_000) return undefined
  }
  return fiber
}

/** Whether `fiber` lives inside `root`'s subtree. */
function within(fiber: Fiber, root: Fiber): boolean {
  let current = fiber
  while (true) {
    if (current === root) return true
    const parent = current.parent.fiber
    if (parent === current) return false
    current = parent
  }
}

/** Services provided by one fiber's whole subtree, sorted lexically. */
function providedServices(ctx: Context, fiber: Fiber): string[] {
  return liveImpls(ctx)
    .filter(impl => within(impl.fiber, fiber))
    .map(impl => impl.name)
    .sort()
}

/** Every live service joined with its owning fiber. */
function describeServices(ctx: Context): DshFlowService[] {
  return liveImpls(ctx)
    .map(impl => ({
      name: impl.name,
      owner: impl.fiber.name,
      state: stateOf(impl.fiber),
      summary: summarizeService(impl.value),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

/** Build the complete read-only snapshot of the running plugin tree. */
export function buildDshFlowTree(ctx: Context): DshFlowTree {
  const fibers: Fiber[] = []
  for (const runtime of ctx.registry.values()) {
    for (const fiber of runtime.fibers) fibers.push(fiber)
  }

  const root = findRoot(ctx)
  const childrenOf = new Map<Fiber, Fiber[]>()
  for (const fiber of fibers) {
    const parent = fiber.parent.fiber
    if (!childrenOf.has(parent)) childrenOf.set(parent, [])
    childrenOf.get(parent)!.push(fiber)
  }

  const visit = (fiber: Fiber): DshFlowNode => ({
    id: String(fiber.uid ?? ''),
    name: fiber.name,
    state: stateOf(fiber),
    anonymous: !fiber.runtime?.name && fiber.uid !== 0,
    provides: providedServices(ctx, fiber),
    inject: Object.keys(fiber.inject),
    config: safeSerialize(fiber.config),
    children: (childrenOf.get(fiber) ?? [])
      .map(visit)
      .sort((left, right) => left.name.localeCompare(right.name)),
  })

  const rootNode: DshFlowNode = root === undefined
    ? { id: '0', name: 'root', state: 'active', provides: [], inject: [], children: [] }
    : visit(root)

  return {
    generatedAt: new Date().toISOString(),
    root: rootNode,
    services: describeServices(ctx),
  }
}

/**
 * Opt-in deep(er) view of one live service's value, looked up by name.
 * Uses a bigger depth budget than the tree snapshot; still bounded and safe.
 */
export function getServiceDetail(ctx: Context, name: string): DshFlowServiceDetail | undefined {
  const store = ctx.reflect.store
  const impl = Object.getOwnPropertySymbols(store)
    .map(key => store[key])
    .find(candidate => candidate !== undefined && candidate.name === name)
  if (impl === undefined) return undefined
  return {
    name: impl.name,
    owner: impl.fiber.name,
    state: stateOf(impl.fiber),
    value: safeSerialize(impl.value, new WeakSet(), 0, 8),
  }
}
