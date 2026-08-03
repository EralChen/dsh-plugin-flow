<template>
  <span
    class="badge"
    :class="[
      `badge--${type}`,
      { 'badge--dot': dot }
    ]"
  >
    <template v-if="dot">
      <span class="badge__dot"></span>
    </template>
    <template v-else-if="count !== undefined">
      {{ count > 99 ? '99+' : count }}
    </template>
    <slot v-else />
  </span>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  dot?: boolean
  count?: number
}>(), {
  type: 'primary',
  dot: false,
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  border-radius: 9999px;
  white-space: nowrap;
  vertical-align: middle;
}

/* dot 模式 */
.badge--dot {
  padding: 0;
  width: 0.5rem;
  height: 0.5rem;
}

.badge__dot {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

/* type 变体 */
.badge--primary {
  background-color: color-mix(in srgb, var(--vvc-primary, #3b82f6) 15%, transparent);
  color: var(--vvc-primary, #3b82f6);
}

.badge--success {
  background-color: color-mix(in srgb, #22c55e 15%, transparent);
  color: #16a34a;
}

.badge--warning {
  background-color: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #d97706;
}

.badge--danger {
  background-color: color-mix(in srgb, #ef4444 15%, transparent);
  color: #dc2626;
}

.badge--info {
  background-color: color-mix(in srgb, #6366f1 15%, transparent);
  color: #4f46e5;
}
</style>