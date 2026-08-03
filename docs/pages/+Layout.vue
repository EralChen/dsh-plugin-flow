<!-- https://vike.dev/Layout -->

<template>
  <ConfigProvider :locale="currentContentLocale">
    <div class="layout">
      <header class="layout-header">
        <div class="layout-header-inner">
          <div class="layout-header-main">
            <a href="/" class="layout-header-brand">
              <img src="../assets/logo.svg" alt="logo" class="layout-header-logo" />
              <span class="layout-header-title">vike-vue-content</span>
            </a>
            <LayoutNav />
          </div>
          <div class="layout-header-actions">

            <LanguageSwitcher />
            <div class="theme-picker-wrapper" ref="pickerRef">
              <button class="theme-picker-trigger" @click="isPickerOpen = !isPickerOpen"
                :class="{ 'is-open': isPickerOpen }" title="主题设置" aria-label="主题设置">
                🎨
              </button>
              <Transition name="picker-panel">
                <div v-if="isPickerOpen" class="theme-picker-panel">
                  <ThemeSettings />
                </div>
              </Transition>
            </div>
            <ThemeToggle />

            <a href="https://github.com/EralChen/vike-vue-content" target="_blank" rel="noopener noreferrer"
              class="github-link" title="GitHub" aria-label="GitHub">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>

          <!-- Mobile actions (slide-in from right, overlay brand) -->
          <div class="header-mobile-actions" :class="{ open: isMobileActionsOpen }">
            <LanguageSwitcher />
            <ThemeToggle />
            <div class="theme-picker-wrapper-mobile" @click.stop>
              <button class="theme-picker-trigger" @click="isPickerOpenMobile = !isPickerOpenMobile"
                :class="{ 'is-open': isPickerOpenMobile }">
                🎨
              </button>
              <Transition name="picker-panel">
                <div v-if="isPickerOpenMobile" class="theme-picker-panel-mobile">
                  <ThemeSettings />
                </div>
              </Transition>
            </div>
            <a href="https://github.com/EralChen/vike-vue-content" target="_blank" rel="noopener noreferrer"
              class="github-link">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>

          <!-- Mobile: collapse/expand toggle -->
          <button class="header-more-btn" @click="isMobileActionsOpen = !isMobileActionsOpen"
            :class="{ open: isMobileActionsOpen }" aria-label="更多操作">
            <svg v-if="!isMobileActionsOpen" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
            <svg v-else viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        </div>
      </header>
      <main class="layout-main">
        <slot></slot>
      </main>
    </div>
  </ConfigProvider>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import 'element-plus/dist/index.css';
import 'vike-vue-content/index.css';
import '../styles/reset.css';
import { ConfigProvider } from 'vike-vue-content/components/config-provider';
import { LayoutNav } from 'vike-vue-content/components/layout-nav';
import { ThemeToggle } from 'vike-vue-content/components/theme-toggle';
import { ThemeSettings } from 'vike-vue-content/components/theme-settings';
import { useTheme } from 'vike-vue-content/composables/theme';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import { type DefineLocaleMessage } from 'vue-i18n'
import { useI18n } from 'vue-i18n'
import { type Locale, localeMap } from '../api/locale'

const { locale } = useI18n<DefineLocaleMessage, Locale>()

const currentContentLocale = computed(() => {
  return localeMap[locale.value].contentLocale
})

// 初始化主题
useTheme();

// 主题设置面板
const isPickerOpen = ref(false)
const pickerRef = ref<HTMLElement | null>(null)
const isPickerOpenMobile = ref(false)

// 移动端操作
const isMobileActionsOpen = ref(false)

function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    isPickerOpen.value = false
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
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: color-mix(in srgb, var(--color-bg) 75%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.layout-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  overflow-x: clip;
}

.layout-header-main {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: 0;
  flex: 1;
}

.layout-header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}

.layout-header-logo {
  width: 32px;
  height: 32px;
}

.layout-header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  transition: color 0.2s ease, background-color 0.2s ease;
}

.github-link:hover {
  color: var(--color-text);
  background-color: var(--color-surface-elevated);
}

.layout-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.theme-picker-wrapper {
  position: relative;
}

.theme-picker-trigger {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  transition: all 0.2s ease;
  font-size: 18px;
  line-height: 1;
  color: var(--color-text-muted);
}

.theme-picker-trigger:hover,
.theme-picker-trigger.is-open {
  background-color: var(--color-surface-elevated);
}

.theme-picker-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
}

/* 过渡动画 */
.picker-panel-enter-active,
.picker-panel-leave-active {
  transition: all 0.2s ease;
}

.picker-panel-enter-from,
.picker-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.layout-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* ==================== Mobile Header Actions ==================== */

.header-more-btn {
  display: none;
  background: none;
  border: none;
  padding: 6px;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.header-more-btn:hover {
  background-color: var(--color-surface-elevated);
}

.header-mobile-actions {
  display: none;
}

.theme-picker-wrapper-mobile {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-picker-panel-mobile {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 50;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
}

@media (max-width: 768px) {
  .layout-main {
    padding: 1rem;
    padding-top: 0;
  }

  .layout-header-actions {
    display: none;
  }

  .header-more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .header-mobile-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    position: absolute;
    right: 42px;
    top: 50%;
    transform: translate(120%, -50%);
    padding: 0 1.5rem;
    background-color: color-mix(in srgb, var(--color-bg) 95%, transparent);
    opacity: 0;
    transition: transform 0.25s ease, opacity 0.2s ease;
  }

  .header-mobile-actions.open {
    transform: translate(0, -50%);
    opacity: 1;
  }
}
</style>

<style>
:root {
  --vvc-header-height: 57px;
}
</style>
