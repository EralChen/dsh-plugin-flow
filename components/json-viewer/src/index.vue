<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'DshJsonViewer' })

const props = withDefaults(defineProps<{
  value: unknown
  /** Key label; omitted for a root value. */
  name?: string
  depth?: number
  /** Auto-expand containers up to this depth (deeper stays collapsed). */
  autoExpandDepth?: number
  /** Max entries rendered per object/array before folding to “N more”. */
  entriesLimit?: number
}>(), {
  name: undefined,
  depth: 0,
  autoExpandDepth: 2,
  entriesLimit: 50,
})

type Kind =
  | 'string' | 'number' | 'boolean' | 'null' | 'undefined'
  | 'function' | 'object' | 'array' | 'symbol' | 'bigint'

function kindOf(value: unknown): Kind {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  return typeof value as Kind
}

const kind = computed(() => kindOf(props.value))
const isContainer = computed(() => kind.value === 'object' || kind.value === 'array')

interface Entry { key: string; value: unknown }

const entries = computed<Entry[]>(() => {
  const value = props.value
  if (Array.isArray(value)) return value.map((item, index) => ({ key: String(index), value: item }))
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).map(key => ({
      key,
      value: (value as Record<string, unknown>)[key],
    }))
  }
  return []
})

const isExpandable = computed(() => isContainer.value && entries.value.length > 0)
const expanded = ref(props.depth < props.autoExpandDepth)

function toggle(): void {
  if (isExpandable.value) expanded.value = !expanded.value
}

const shownEntries = computed(() => entries.value.slice(0, props.entriesLimit))
const hiddenCount = computed(() => Math.max(0, entries.value.length - shownEntries.value.length))

const primitiveText = computed(() => {
  const value = props.value
  switch (kind.value) {
    case 'string': return JSON.stringify(value)
    case 'undefined': return 'undefined'
    case 'function': return 'ƒ ()'
    case 'symbol': return String(value)
    case 'bigint': return `${String(value)}n`
    default: return String(value)
  }
})

const collapsedPreview = computed(() => {
  if (kind.value === 'array') return `[ … ] ${entries.value.length} items`
  return `{ … } ${entries.value.length} keys`
})
</script>

<template>
  <div class="jv">
    <div
      class="jv__row"
      :class="{ 'jv__row--clickable': isExpandable }"
      :style="{ paddingLeft: `${depth * 14}px` }"
      @click="toggle"
    >
      <span class="jv__caret">
        <span v-if="isExpandable" class="jv__caret-icon" :class="{ 'is-open': expanded }">▸</span>
      </span>
      <span v-if="name !== undefined" class="jv__key">{{ name }}</span>
      <span v-if="name !== undefined" class="jv__colon">:</span>

      <template v-if="!isContainer">
        <span class="jv__value" :data-kind="kind">{{ primitiveText }}</span>
      </template>
      <template v-else-if="!isExpandable">
        <span class="jv__bracket">{{ kind === 'array' ? '[]' : '{}' }}</span>
      </template>
      <template v-else>
        <span v-if="!expanded" class="jv__preview">{{ collapsedPreview }}</span>
        <span v-else class="jv__bracket">{{ kind === 'array' ? '[' : '{' }}</span>
      </template>
    </div>

    <template v-if="isExpandable && expanded">
      <DshJsonViewer
        v-for="entry in shownEntries"
        :key="entry.key"
        :name="entry.key"
        :value="entry.value"
        :depth="depth + 1"
        :auto-expand-depth="autoExpandDepth"
        :entries-limit="entriesLimit"
      />
      <div v-if="hiddenCount > 0" class="jv__more" :style="{ paddingLeft: `${(depth + 1) * 14}px` }">
        … {{ hiddenCount }} more
      </div>
      <div class="jv__row" :style="{ paddingLeft: `${depth * 14}px` }">
        <span class="jv__caret" />
        <span class="jv__bracket">{{ kind === 'array' ? ']' : '}' }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.jv {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}
.jv__row {
  display: flex;
  align-items: baseline;
  min-height: 20px;
}
.jv__row--clickable {
  cursor: pointer;
  border-radius: 4px;
}
.jv__row--clickable:hover {
  background: rgba(37, 99, 235, 0.06);
}
.jv__caret {
  flex: none;
  width: 14px;
  color: #9ca3af;
  font-size: 10px;
  user-select: none;
}
.jv__caret-icon {
  display: inline-block;
  transition: transform 0.12s;
}
.jv__caret-icon.is-open {
  transform: rotate(90deg);
}
.jv__key {
  color: #7c3aed;
  overflow-wrap: anywhere;
}
.jv__colon {
  color: #9ca3af;
  margin-right: 4px;
}
.jv__value {
  min-width: 0;
  overflow-wrap: anywhere;
}
.jv__value[data-kind='string'] {
  color: #059669;
}
.jv__value[data-kind='number'] {
  color: #2563eb;
}
.jv__value[data-kind='boolean'] {
  color: #d97706;
}
.jv__value[data-kind='null'],
.jv__value[data-kind='undefined'] {
  color: #9ca3af;
  font-style: italic;
}
.jv__value[data-kind='function'] {
  color: #7c3aed;
  font-style: italic;
}
.jv__value[data-kind='symbol'],
.jv__value[data-kind='bigint'] {
  color: #0d9488;
}
.jv__bracket {
  color: #9ca3af;
}
.jv__preview {
  color: #9ca3af;
}
.jv__more {
  color: #9ca3af;
  font-style: italic;
}
</style>
