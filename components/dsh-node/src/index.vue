<script lang="ts" setup>
import { MagnetRule, VkRegisterNode } from '@vunk/flow/components/register-node'
import type { __VkRegisterNode } from '@vunk/flow/components/register-node'
import { computed } from 'vue'

defineOptions({
  name: 'DshNode',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  /** LogicFlow node type this component registers. */
  type?: string
}>(), {
  type: 'dsh-node',
})

const effect = computed(() => ['name', 'state', 'color', 'categoryLabel', 'provides', 'matched', 'packageName'])

/** 上入下出：top 是输入桩（passive），bottom 是输出桩（active）。 */
const getDefaultAnchor: __VkRegisterNode.GetDefaultAnchor = function () {
  const { x, y, width, height, id } = this
  return [
    { id: `${id}-top`, x, y: y - height / 2, magnetRule: MagnetRule.passive, edgeAddable: false },
    { id: `${id}-bottom`, x, y: y + height / 2, magnetRule: MagnetRule.active },
  ]
}
</script>

<template>
  <VkRegisterNode
    :type="props.type"
    :effect="effect"
    :get-default-anchor="getDefaultAnchor"
  >
    <template #default="{ properties }">
      <div class="dsh-node" :class="{ 'is-matched': properties.matched }" :title="properties.packageName" :style="{ '--dsh-cat': properties.color }">
        <span class="dsh-node__dot"></span>
        <div class="dsh-node__body">
          <span class="dsh-node__name">{{ properties.name }}</span>
          <span class="dsh-node__meta">
            {{ properties.categoryLabel }} · {{ properties.state }}
          </span>
        </div>
      </div>
    </template>
  </VkRegisterNode>
</template>

<style scoped>
.dsh-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  max-width: 360px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid var(--dsh-cat, #64748b);
  background: #fff;
  box-sizing: border-box;
}
.dsh-node__dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dsh-cat, #64748b);
}
.dsh-node__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh-node__name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsh-node__meta {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}
.dsh-node.is-matched {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
  border-color: #2563eb !important;
}
</style>
