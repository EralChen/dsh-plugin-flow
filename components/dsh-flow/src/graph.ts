/**
 * Tree → LogicFlow graph conversion. Pure function: the runtime tree only
 * carries names/states; category color/label come from the catalog.
 * @module @dshflow/components/dsh-flow/graph
 */

import type LogicFlow from '@logicflow/core'
import { categorize } from '@dshflow/shared/catalog'
import type { DshFlowNode, DshFlowState, DshFlowTree } from '@dshflow/shared/types/dsh-flow'

/** What a rendered node exposes to the click handler / detail panel. */
export interface DshFlowNodeProps {
  id: string
  name: string
  state: DshFlowState
  provides: string[]
  inject: string[]
  color: string
  categoryLabel: string
}

function nodeId(node: DshFlowNode): string {
  return node.id === '' ? 'root' : node.id
}

export function buildGraphData(tree: DshFlowTree): LogicFlow.GraphConfigData {
  const nodes: LogicFlow.GraphConfigData['nodes'] = []
  const edges: LogicFlow.GraphConfigData['edges'] = []

  const walk = (node: DshFlowNode): void => {
    const category = categorize(node.name)
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
        color: category.color,
        categoryLabel: category.label,
      } satisfies DshFlowNodeProps,
    })
    for (const child of node.children) {
      edges.push({
        id: `e:${id}:${nodeId(child)}`,
        type: 'VkEdgeMaxkb',
        sourceNodeId: id,
        targetNodeId: nodeId(child),
        sourceAnchorId: `${id}-bottom`,
        targetAnchorId: `${nodeId(child)}-top`,
      })
      walk(child)
    }
  }

  walk(tree.root)
  return { nodes, edges }
}
