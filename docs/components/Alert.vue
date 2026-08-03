<template>
  <div
    v-if="visible"
    class="alert"
    :class="[`alert--${type}`]"
    role="alert"
  >
    <div v-if="title" class="alert__title">{{ title }}</div>
    <div class="alert__content">
      <slot />
    </div>
    <button
      v-if="closable"
      class="alert__close"
      @click="visible = false"
      aria-label="关闭"
    >
      &times;
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

withDefaults(defineProps<{
  type?: 'success' | 'warning' | 'error' | 'info'
  closable?: boolean
  title?: string
}>(), {
  type: 'info',
  closable: false,
})

const visible = ref(true)
</script>

<style scoped>
.alert {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--vvc-radius, 0.375rem);
  border: 1px solid;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.alert__title {
  width: 100%;
  font-weight: 600;
  font-size: 0.9375rem;
}

.alert__content {
  flex: 1;
  min-width: 0;
}

.alert__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
  color: inherit;
}

.alert__close:hover {
  opacity: 1;
}

/* type 变体 */
.alert--info {
  background-color: color-mix(in srgb, var(--vvc-primary, #3b82f6) 10%, transparent);
  border-color: color-mix(in srgb, var(--vvc-primary, #3b82f6) 30%, transparent);
  color: var(--vvc-primary, #3b82f6);
}

.alert--success {
  background-color: color-mix(in srgb, #22c55e 10%, transparent);
  border-color: color-mix(in srgb, #22c55e 30%, transparent);
  color: #16a34a;
}

.alert--warning {
  background-color: color-mix(in srgb, #f59e0b 10%, transparent);
  border-color: color-mix(in srgb, #f59e0b 30%, transparent);
  color: #d97706;
}

.alert--error {
  background-color: color-mix(in srgb, #ef4444 10%, transparent);
  border-color: color-mix(in srgb, #ef4444 30%, transparent);
  color: #dc2626;
}
</style>