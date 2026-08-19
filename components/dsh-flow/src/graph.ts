/**
 * Tree → LogicFlow graph conversion. Pure function: the runtime tree only
 * carries names/states; category color/label come from the catalog.
 * @module @dshflow/components/dsh-flow/graph
 */

import type LogicFlow from '@logicflow/core'
import { CATEGORIES, categoryById, categorize } from '@dshflow/shared/catalog'
import type { DshFlowNode, DshFlowState, DshFlowTree } from '@dshflow/shared/types/dsh-flow'

/** What a rendered node exposes to the click handler / detail panel. */
export interface DshFlowNodeProps {
  id: string
  name: string
  packageName?: string
  state: DshFlowState
  provides: string[]
  inject: string[]
  config?: unknown
  color: string
  categoryLabel: string
  /** Client-side: true when this node matched the active search query. */
  matched?: boolean
}

function nodeId(node: DshFlowNode): string {
  return node.id === '' ? 'root' : node.id
}

/** Loader / scaffolding fiber names are rendered as a distinct gray category. */
export const STRUCTURAL_NAMES = new Set(['Loader', 'Include', 'Group', 'isolate', 'PresetTree', 'scope'])

export function buildGraphData(tree: DshFlowTree): LogicFlow.GraphConfigData {
  const nodes: LogicFlow.GraphConfigData['nodes'] = []
  const edges: LogicFlow.GraphConfigData['edges'] = []

  const walk = (node: DshFlowNode, parentId: string | undefined): void => {
    // Collapse only anonymous fibers (ctx.inject scoped registrations): they
    // have no identity of their own, so their children attach to the current
    // parent. Structural nodes stay visible — they carry real hierarchy
    // (bundle layer, agent-preset scopes) — but render as a gray category.
    if (node.anonymous === true) {
      for (const child of node.children) walk(child, parentId)
      return
    }

    const category = node.categoryId !== undefined ? categoryById(node.categoryId) : categorize(node.name)
    const id = nodeId(node)
    nodes.push({
      id,
      type: 'dsh-node',
      x: 0,
      y: 0,
      properties: {
        id: node.id,
        name: node.name,
        packageName: node.packageName,
        state: node.state,
        provides: node.provides,
        inject: node.inject,
        config: node.config,
        color: category.color,
        categoryLabel: category.label,
      } satisfies DshFlowNodeProps,
    })
    if (parentId !== undefined) {
      edges.push({
        id: `e:${parentId}:${id}`,
        type: 'VkEdgeMaxkb',
        sourceNodeId: parentId,
        targetNodeId: id,
        sourceAnchorId: `${parentId}-bottom`,
        targetAnchorId: `${id}-top`,
      })
    }
    for (const child of node.children) walk(child, id)
  }

  walk(tree.root, undefined)
  return { nodes, edges }
}

/**
 * Keep only nodes whose name contains `query` (case-insensitive) plus their
 * ancestor chain, and mark the matches for highlight. An empty query (or no
 * match) returns the full graph unchanged so the tree never vanishes.
 */
export function filterSearchGraph(
  data: LogicFlow.GraphConfigData,
  query: string,
): LogicFlow.GraphConfigData {
  const q = query.trim().toLowerCase()
  if (q === '') return data

  const matchedIds = new Set<string>()
  for (const node of data.nodes ?? []) {
    const name = String(node.properties?.name ?? '').toLowerCase()
    if (name.includes(q)) matchedIds.add(String(node.id))
  }
  if (matchedIds.size === 0) return data

  // Walk edges up from every match to keep the ancestor chain.
  const parent = new Map<string, string>()
  for (const edge of data.edges ?? []) {
    if (typeof edge.sourceNodeId === 'string' && typeof edge.targetNodeId === 'string') {
      parent.set(edge.targetNodeId, edge.sourceNodeId)
    }
  }
  const keep = new Set<string>()
  for (const id of matchedIds) {
    let current: string | undefined = id
    while (current !== undefined && !keep.has(current)) {
      keep.add(current)
      current = parent.get(current)
    }
  }

  return {
    nodes: (data.nodes ?? []).map((node) => {
      if (typeof node.id !== 'string' || !keep.has(node.id)) return undefined
      if (!matchedIds.has(node.id)) return node
      const properties = node.properties as DshFlowNodeProps | undefined
      return { ...node, properties: { ...properties, matched: true } }
    }).filter((node): node is NonNullable<typeof node> => node !== undefined),
    edges: (data.edges ?? []).filter(edge =>
      typeof edge.sourceNodeId === 'string'
      && typeof edge.targetNodeId === 'string'
      && keep.has(edge.sourceNodeId)
      && keep.has(edge.targetNodeId)
    ),
  }
}
