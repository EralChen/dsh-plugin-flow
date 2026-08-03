<template>
  <div class="lang-switcher" ref="rootRef">
    <button class="lang-switcher-trigger" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen" title="切换语言"
      aria-label="切换语言">
      <span class="lang-switcher-icon">🌐</span>
      <span class="lang-switcher-label">{{ localeMap[locale].label }}</span>
    </button>
    <Transition name="lang-menu">
      <ul v-if="isOpen" class="lang-switcher-menu">
        <li v-for="item in localeOptions" :key="item.value">
          <Link class="lang-switcher-item" :class="{ active: item.value === locale }" :href="resolvePath(item.value)"
          :data-vike="!!urlLocaleInfo.restPath"
            keep-scroll-position @click="switchLocale(item.value)">
            {{ item.label }}
          </Link>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Link } from 'vike-vue-content/components/link'
import { useI18n, type DefineLocaleMessage } from 'vue-i18n'
import { Locale, localeOptions, localeMap } from '../api/locale'
import { usePageContext } from 'vike-vue/usePageContext'

const { locale, availableLocales } = useI18n<DefineLocaleMessage, Locale>()
const pageContext = usePageContext()
const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const urlLocaleInfo = computed(() => {
  const paths = pageContext.urlPathname.split('/').filter(Boolean)
  const firstPath = paths[0] as never // 获取第一个路径段
  let locale: Locale = Locale.enUS
  let restPath = ''
  if (availableLocales.includes(firstPath)) {
    locale = firstPath as Locale
    restPath = '/' + paths.slice(1).join('/') // 获取剩余路径
  }
  return {
    locale,
    restPath
  }

})
onMounted(() => {
  // 在组件挂载时，将当前的 locale 设置为 URL 中的 locale
  locale.value = urlLocaleInfo.value.locale
})

function resolvePath(locale: Locale) {
  return `/${locale}${urlLocaleInfo.value.restPath}`
}

function switchLocale(code: Locale) {
  isOpen.value = false
  locale.value = code
}

function handleClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.lang-switcher {
  position: relative;
}

.lang-switcher-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: var(--vvc-radius, 0.375rem);
  transition: all 0.2s ease;
  font-size: 14px;
  line-height: 1;
  color: var(--vvc-text-muted, #475569);
}

.dark .lang-switcher-trigger {
  color: #94a3b8;
}

.lang-switcher-trigger:hover,
.lang-switcher-trigger.is-open {
  background-color: var(--vvc-bg-elevated, #f1f5f9);
}

.dark .lang-switcher-trigger:hover,
.dark .lang-switcher-trigger.is-open {
  background-color: #334155;
}

.lang-switcher-icon {
  font-size: 16px;
}

.lang-switcher-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 4px;
  list-style: none;
  min-width: 140px;
  background-color: var(--vvc-bg, #ffffff);
  border: 1px solid var(--vvc-border, #e2e8f0);
  border-radius: var(--vvc-radius, 0.375rem);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dark .lang-switcher-menu {
  background-color: #1e293b;
  border-color: #334155;
}

.lang-switcher-item {
  display: block;
  padding: 8px 12px;
  border-radius: var(--vvc-radius, 0.375rem);
  font-size: 14px;
  text-decoration: none;
  color: var(--vvc-text, #0f172a);
  transition: background-color 0.15s ease;
}

.dark .lang-switcher-item {
  color: #f1f5f9;
}

.lang-switcher-item:hover {
  background-color: var(--vvc-bg-elevated, #f1f5f9);
}

.dark .lang-switcher-item:hover {
  background-color: #334155;
}

.lang-switcher-item.active {
  color: var(--vvc-primary, #3b82f6);
  font-weight: 600;
}

.lang-menu-enter-active,
.lang-menu-leave-active {
  transition: all 0.2s ease;
}

.lang-menu-enter-from,
.lang-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
