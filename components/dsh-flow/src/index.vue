<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import type LogicFlow from '@logicflow/core'
import { VkLogicFlow } from '@vunk/flow/components/logic-flow'
import { VkLogicFlowRender } from '@vunk/flow/components/logic-flow-render'
import { VkEdgeMaxkb } from '@vunk/flow/components/edge-maxkb'
import { Dagre } from '@vunk/flow/shared/plugins'
import type { DshFlowTree } from '@dshflow/shared/types/dsh-flow'
import DshNode from '@dshflow/components/dsh-node'
import { buildGraphData } from './graph'
import type { DshFlowNodeProps } from './graph'

defineOptions({
  name: 'DshFlow',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  tree: DshFlowTree
  /** Dagre 方向：TB 上下、LR 左右、BT 下上、RL 右左。 */
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
}>(), {
  rankdir: 'TB',
})

const emit = defineEmits<{
  (e: 'node-click', payload: DshFlowNodeProps): void
}>()

const lf = shallowRef<LogicFlow>()
const graphData = computed(() => buildGraphData(props.tree))

const flowOptions = computed(() => ({
  grid: true,
  plugins: [Dagre],
  pluginsOptions: { dagre: { rankdir: props.rankdir } },
}))

interface DagreExtension {
  layout: () => Promise<void>
}

function resolveDagre(): DagreExtension | null {
  const extension = lf.value?.extension?.dagre as Partial<DagreExtension> | undefined
  if (extension === undefined || typeof extension.layout !== 'function') return null
  return extension as DagreExtension
}

async function autoLayout(): Promise<void> {
  await resolveDagre()?.layout()
}

function onLoad(e: { lf: LogicFlow }): void {
  lf.value = e.lf
  e.lf.on('node:click', ({ data }) => {
    const properties = data?.properties as DshFlowNodeProps | undefined
    if (properties !== undefined) emit('node-click', properties)
  })
  // Layout once nodes have mounted and vue-node-registry measured their sizes.
  e.lf.on('graph:rendered', () => {
    void autoLayout()
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
