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
  state: DshFlowState
  provides: string[]
  inject: string[]
  config?: unknown
  color: string
  categoryLabel: string
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
