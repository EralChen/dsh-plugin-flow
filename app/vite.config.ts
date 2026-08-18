import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The visualization is served by the dshflow plugin under `/dshflow/`, so both
// `base` and `outDir` are pinned to that contract.
export default defineConfig({
  base: '/dshflow/',
  build: {
    outDir: '../plugin/web',
    emptyOutDir: true,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@dshflow/components': fileURLToPath(new URL('../components', import.meta.url)),
      '@dshflow/shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
})
