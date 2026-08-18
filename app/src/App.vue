<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { DshFlow } from '@dshflow/components/dsh-flow'
import type { DshFlowNodeProps } from '@dshflow/components/dsh-flow'
import type { DshFlowTree } from '@dshflow/shared/types/dsh-flow'
import { fetchTree, subscribeTree } from './api'
import { demoTree } from './demo'

const tree = ref<DshFlowTree>(demoTree)
const selected = ref<DshFlowNodeProps | null>(null)
const connected = ref(false)
const flowRef = ref<InstanceType<typeof DshFlow>>()

let unsubscribe: (() => void) | undefined

onMounted(async () => {
  try {
    tree.value = await fetchTree()
    connected.value = true
  } catch {
    tree.value = demoTree
    connected.value = false
  }
  unsubscribe = subscribeTree((next) => {
    tree.value = next
    connected.value = true
  })
})

onBeforeUnmount(() => unsubscribe?.())

function onNodeClick(payload: DshFlowNodeProps): void {
  selected.value = payload
}

function onAutoLayout(): void {
  void flowRef.value?.autoLayout()
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <div class="bar__title">
        <span class="bar__logo">◉</span>
        <span>dshflow</span>
        <span class="bar__sub">DeepSeek Harness · plugin tree</span>
      </div>
      <div class="bar__actions">
        <span class="badge" :class="connected ? 'badge--on' : 'badge--off'">
          {{ connected ? 'live' : 'demo' }}
        </span>
        <button class="btn" @click="onAutoLayout">自动布局</button>
      </div>
    </header>

    <div class="body">
      <main class="canvas">
        <DshFlow ref="flowRef" :tree="tree" @node-click="onNodeClick" />
      </main>

      <aside class="side">
        <template v-if="selected">
          <h2>{{ selected.name }}</h2>
          <p class="side__state" :style="{ color: selected.color }">
            ● {{ selected.state }}
          </p>
          <p class="side__hint">{{ selected.categoryLabel }} · id {{ selected.id || 'root' }}</p>

          <h3>提供 (provides)</h3>
          <p v-if="selected.provides.length === 0" class="muted">—</p>
          <ul v-else>
            <li v-for="item in selected.provides" :key="item">{{ item }}</li>
          </ul>

          <h3>注入 (inject)</h3>
          <p v-if="selected.inject.length === 0" class="muted">—</p>
          <ul v-else>
            <li v-for="item in selected.inject" :key="item">{{ item }}</li>
          </ul>
        </template>
        <template v-else>
          <h2>dshflow</h2>
          <p class="muted">点击任意节点查看它的状态、提供的服务与依赖。</p>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
.bar__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.bar__logo {
  color: #2563eb;
}
.bar__sub {
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}
.bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge--on {
  color: #065f46;
  background: #d1fae5;
}
.badge--off {
  color: #92400e;
  background: #fef3c7;
}
.btn {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.btn:hover {
  background: #f3f4f6;
}
.body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.canvas {
  flex: 1;
  min-width: 0;
}
.side {
  width: 300px;
  padding: 16px;
  border-left: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow: auto;
}
.side h2 {
  margin: 0 0 4px;
  font-size: 15px;
  word-break: break-all;
}
.side h3 {
  margin: 16px 0 4px;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}
.side ul {
  margin: 0;
  padding-left: 16px;
  font-size: 13px;
}
.side__state {
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
}
.side__hint {
  color: #9ca3af;
  font-size: 12px;
}
.muted {
  color: #9ca3af;
  font-size: 13px;
}
</style>
