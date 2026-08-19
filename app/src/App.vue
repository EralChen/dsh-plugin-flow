<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { DshFlow } from '@dshflow/components/dsh-flow'
import type { DshFlowNodeProps } from '@dshflow/components/dsh-flow'
import { DshJsonViewer } from '@dshflow/components/json-viewer'
import type { DshFlowServiceDetail, DshFlowTree } from '@dshflow/shared/types/dsh-flow'
import { fetchServiceDetail, fetchTree, sendDebug, subscribe } from './api'
import { demoTree } from './demo'

const tree = ref<DshFlowTree | null>(null)
const selected = ref<DshFlowNodeProps | null>(null)
const serviceDetail = ref<DshFlowServiceDetail | null>(null)
const connected = ref(false)
const flowRef = ref<InstanceType<typeof DshFlow>>()
const searchText = ref('')
const debugText = ref('')
const debugStatus = ref('')

let unsubscribe: (() => void) | undefined
let lastStructural = ''

function structuralKey(value: DshFlowTree): string {
  return JSON.stringify({ root: value.root, services: value.services })
}

function applyTree(value: DshFlowTree): void {
  const key = structuralKey(value)
  if (key === lastStructural) return
  lastStructural = key
  tree.value = value
}

onMounted(async () => {
  try {
    applyTree(await fetchTree())
    connected.value = true
  } catch {
    applyTree(demoTree)
    connected.value = false
  }
  unsubscribe = subscribe({
    onTree(next) {
      applyTree(next)
      connected.value = true
    },
  })
})

onBeforeUnmount(() => unsubscribe?.())

function onNodeClick(payload: DshFlowNodeProps): void {
  selected.value = payload
}

function onAutoLayout(): void {
  void flowRef.value?.autoLayout()
}

async function openService(name: string): Promise<void> {
  try {
    serviceDetail.value = await fetchServiceDetail(name)
  } catch (error) {
    const notFound = error instanceof Error && error.message.includes('404')
    serviceDetail.value = {
      name,
      owner: notFound ? '（未提供 · 插件正在等待该服务）' : '（获取失败）',
      state: 'pending',
      value: notFound ? null : String(error),
    }
  }
}

async function onDebug(): Promise<void> {
  const text = debugText.value.trim()
  if (text === '') return
  debugStatus.value = '…'
  try {
    const result = await sendDebug(text)
    if (result.ok) {
      debugStatus.value = `sent → ${result.sessionId ?? ''}`
      debugText.value = ''
    } else {
      debugStatus.value = result.error ?? 'failed'
    }
  } catch (error) {
    debugStatus.value = String(error)
  }
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
        <input
          v-model="searchText"
          class="toolbar__search"
          type="search"
          placeholder="搜索节点…"
        >
        <button class="btn" @click="onAutoLayout">自动布局</button>
      </div>
    </header>

    <div class="body">
      <main class="canvas">
        <DshFlow v-if="tree" ref="flowRef" :tree="tree" :search="searchText" @node-click="onNodeClick" />
        <div v-else class="canvas__empty">加载中…</div>
      </main>

      <aside class="side">
        <template v-if="selected">
          <div class="detail__head">
            <h2>{{ selected.name }}</h2>
            <span class="chip chip--state" :style="{ borderColor: selected.color, color: selected.color }">{{ selected.state }}</span>
          </div>
          <p v-if="selected.packageName" class="side__pkg" :title="selected.packageName">{{ selected.packageName }}</p>
          <p class="side__hint">{{ selected.categoryLabel }} · id {{ selected.id || 'root' }}</p>

          <h3>提供 (provides)</h3>
          <p v-if="selected.provides.length === 0" class="muted">—</p>
          <div v-else class="chips">
            <span
              v-for="item in selected.provides"
              :key="item"
              class="chip chip--svc"
              @click="openService(item)"
            >{{ item }}</span>
          </div>

          <h3>注入 (inject)</h3>
          <p v-if="selected.inject.length === 0" class="muted">—</p>
          <div v-else class="chips">
            <span
              v-for="item in selected.inject"
              :key="item"
              class="chip chip--svc"
              @click="openService(item)"
            >{{ item }}</span>
          </div>

          <template v-if="selected.config !== undefined">
            <h3>配置 (config)</h3>
            <div class="detail__config">
              <DshJsonViewer :value="selected.config" :auto-expand-depth="2" />
            </div>
          </template>
        </template>
        <template v-else>
          <h2>dshflow</h2>
          <p class="muted">点击任意节点查看它的状态、配置与依赖。</p>
        </template>

        <details class="side__details">
          <summary>全局服务 ({{ tree?.services.length ?? 0 }})</summary>
          <ul>
            <li
              v-for="svc in tree?.services ?? []"
              :key="svc.name"
              class="side__svc"
              @click="openService(svc.name)"
            >
              <code>{{ svc.name }}</code>
              <span class="muted"> · {{ svc.owner }} · {{ svc.summary?.ctor ?? svc.summary?.type }}</span>
            </li>
          </ul>
        </details>
      </aside>
    </div>

    <footer class="debugbar">
      <input
        v-model="debugText"
        class="debugbar__input"
        placeholder="debugger：给 agent 发消息，回车发送"
        @keyup.enter="onDebug"
      >
      <button class="btn" @click="onDebug">发送</button>
      <span class="muted">{{ debugStatus }}</span>
    </footer>

    <div v-if="serviceDetail" class="modal" @click.self="serviceDetail = null">
      <div class="modal__box">
        <div class="modal__head">
          <code>{{ serviceDetail.name }}</code>
          <button class="modal__close" @click="serviceDetail = null">×</button>
        </div>
        <p class="muted">{{ serviceDetail.owner }} · {{ serviceDetail.state }}</p>
        <div class="modal__code">
          <DshJsonViewer :value="serviceDetail.value" :auto-expand-depth="3" />
        </div>
      </div>
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
.toolbar__search {
  flex: none;
  width: 200px;
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #1f2937;
}
.toolbar__search:focus {
  outline: none;
  border-color: #2563eb;
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
.debugbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}
.debugbar__input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
.debugbar__status {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.canvas {
  flex: 1;
  min-width: 0;
}
.canvas__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 14px;
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
.side__pkg {
  margin: 0 0 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: #6b7280;
  word-break: break-all;
}
.detail__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.detail__head h2 {
  flex: 1;
  min-width: 0;
}
.detail__config {
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  overflow: auto;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chip {
  font-size: 11px;
  padding: 1px 8px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  color: #374151;
  background: #fff;
  overflow-wrap: anywhere;
}
.chip--state {
  flex: none;
  font-weight: 600;
  text-transform: uppercase;
}
.chip--svc {
  cursor: pointer;
}
.chip--svc:hover {
  border-color: #2563eb;
  color: #2563eb;
}
.side__details {
  margin-top: 12px;
}
.side__details summary {
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
}
.side__code {
  max-height: 300px;
  overflow: auto;
  font-size: 11px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
.muted {
  color: #9ca3af;
  font-size: 13px;
}
.side__svc {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.side__svc:hover {
  background: #eef2ff;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal__box {
  display: flex;
  flex-direction: column;
  width: min(720px, 90vw);
  max-height: 80vh;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
}
.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal__close {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}
.modal__code {
  flex: 1;
  overflow: auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}
</style>
