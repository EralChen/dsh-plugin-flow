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
 * Resolve a fiber's full package name (`@deepseek-ai/dsh-tool-bash`) from the
 * Loader entry that mounted it — no guessing. The cordis base `Fiber` has no
 * `entry`; the loader package augments it (and fills it for every fiber under
 * a loader entry), so read it through a narrow structural cast to keep this
 * plugin free of a loader type dependency. Walks up the parent chain for
 * sub-fibers that inherit a mounted package.
 */
function packageNameOf(fiber: Fiber): string | undefined {
  let current: Fiber | undefined = fiber
  while (current !== undefined) {
    const entry = (current as unknown as { entry?: { options?: { name?: string } } }).entry
    if (entry?.options?.name !== undefined && entry.options.name !== '') {
      return entry.options.name
    }
    const parentFiber: Fiber | undefined = current.parent?.fiber
    if (parentFiber === undefined || parentFiber === current) break
    current = parentFiber
  }
  return undefined
}

/** Structured marker for values JSON cannot carry (functions, cycles, depth…). */
function marker(kind: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { $dsh: kind, ...extra }
}

/**
 * Project an arbitrary runtime value into a bounded, JSON-safe shape. JSON
 * cannot carry functions/cycles/bigints, so those become structured markers
 * (`{ $dsh: ... }`) the viewer renders as quiet labels instead of fake data.
 * Budgets are generous (depth 32, 500 keys/items, 8k strings) so truncation
 * markers are rare; the viewer can always show more of what IS serialized.
 */
function safeSerialize(value: unknown, seen: WeakSet<object> = new WeakSet(), depth = 0, maxDepth = 32): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return value.length > 8000 ? marker('truncated-string', { length: value.length }) : value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return marker('bigint', { text: `${value}` })
  if (typeof value === 'function') return marker('function', { name: (value as (...args: unknown[]) => unknown).name || 'anonymous' })
  if (typeof value === 'symbol') return marker('symbol')
  if (depth >= maxDepth) return marker('max-depth')

  if (seen.has(value)) return marker('circular')
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      const cap = 500
      const head = value.slice(0, cap).map(item => safeSerialize(item, seen, depth + 1))
      if (value.length > cap) head.push(marker('truncated', { count: value.length - cap }))
      return head
    }
    const out: Record<string, unknown> = {}
    const keys = Object.keys(value)
    const cap = 500
    for (const key of keys.slice(0, cap)) {
      out[key] = safeSerialize((value as Record<string, unknown>)[key], seen, depth + 1)
    }
    if (keys.length > cap) out['…'] = marker('truncated-keys', { count: keys.length - cap })
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
    packageName: packageNameOf(fiber),
    state: stateOf(fiber),
    anonymous: !fiber.runtime?.name && fiber.uid !== 0,
    provides: providedServices(ctx, fiber),
    inject: Object.keys(fiber.inject),
    config: safeSerialize(fiber.config, new WeakSet(), 0, 8),
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
    value: safeSerialize(impl.value, new WeakSet(), 0, 32),
  }
}
