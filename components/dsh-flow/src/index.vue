<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import type LogicFlow from '@logicflow/core'
import { Graph } from '@antv/graphlib'
// Deep-import dagre only: @antv/layout's index re-exports a web-worker
// supervisor, which the dsh client loader cannot serve as a separate asset.
import { DagreLayout } from '@antv/layout/lib/dagre'
import { VkLogicFlow } from '@vunk/flow/components/logic-flow'
import { VkLogicFlowRender } from '@vunk/flow/components/logic-flow-render'
import { VkEdgeMaxkb } from '@vunk/flow/components/edge-maxkb'
import type { DshFlowTree } from '@dshflow/shared/types/dsh-flow'
import DshNode from '@dshflow/components/dsh-node'
import { buildGraphData, filterSearchGraph } from './graph'
import type { DshFlowNodeProps } from './graph'

defineOptions({
  name: 'DshFlow',
  inheritAttrs: false,
})

const props = defineProps<{
  tree: DshFlowTree
  /** When non-empty, keep only matching nodes (+ their ancestor chain). */
  search?: string
}>()

const emit = defineEmits<{
  (e: 'node-click', payload: DshFlowNodeProps): void
}>()

const lf = shallowRef<LogicFlow>()
const graphData = computed(() => {
  const full = buildGraphData(props.tree)
  const q = props.search?.trim() ?? ''
  return q === '' ? full : filterSearchGraph(full, q)
})

const flowOptions = { grid: true }

/**
 * Dagre base layout (the same engine vunk-flow's Dagre plugin uses): lay the
 * tree out, apply every node position, then fit the view.
 */
async function layoutGraph(): Promise<void> {
  const lfInst = lf.value
  if (lfInst === undefined) return
  const nodes = (graphData.value.nodes ?? []).map((node) => {
    const model = lfInst.getNodeModelById(String(node.id))
    return { id: String(node.id), width: model?.width || 220, height: model?.height || 56 }
  })
  const edges = (graphData.value.edges ?? []).map(edge => ({
    sourceNodeId: String(edge.sourceNodeId),
    targetNodeId: String(edge.targetNodeId),
  }))

  const dagre = new DagreLayout({
    rankdir: 'TB',
    nodeSize(node: { id?: unknown; data?: { width?: number; height?: number } }) {
      const data = node.data as { width?: number; height?: number }
      return [data.width ?? 220, data.height ?? 56]
    },
  } as never)
  const graph = new Graph({
    nodes: nodes.map(node => ({
      id: node.id,
      data: { x: 0, y: 0, width: node.width, height: node.height },
    })),
    edges: edges.map((edge, index) => ({
      id: `dsh-e-${index}`,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      data: {},
    })),
  })
  const layoutData = await dagre.execute(graph as never)
  for (const node of layoutData.nodes ?? []) {
    const data = node.data as { x?: number; y?: number }
    // moveNode2Coordinate updates the node model AND its edges.
    lfInst.graphModel.moveNode2Coordinate(String(node.id), data.x ?? 0, data.y ?? 0)
  }
  lfInst.fitView()
}

function autoLayout(): void {
  void layoutGraph()
}

function onLoad(e: { lf: LogicFlow }): void {
  lf.value = e.lf
  e.lf.on('node:click', ({ data }) => {
    const properties = data?.properties as DshFlowNodeProps | undefined
    if (properties !== undefined) emit('node-click', properties)
  })
  // Layout after nodes have mounted and vue-node-registry measured their
  // sizes. Debounce so rapid re-renders don't stack concurrent layouts.
  let layoutTimer: ReturnType<typeof setTimeout> | undefined
  e.lf.on('graph:rendered', () => {
    if (layoutTimer !== undefined) return
    layoutTimer = setTimeout(() => {
      layoutTimer = undefined
      void layoutGraph()
    }, 100)
  })
}

defineExpose({ autoLayout })
</script>

<template>
  <VkLogicFlow
    class="dsh-flow"
    :default-options="flowOptions"
    :default-edge-type="'VkEdgeMaxkb'"
    @load="onLoad"
  >
    <DshNode type="dsh-node" />
    <VkEdgeMaxkb />
    <VkLogicFlowRender :model-value="graphData" :fit-view="false" />
  </VkLogicFlow>
</template>

<style>
.dsh-flow {
  width: 100%;
  height: 100%;
}
</style>
