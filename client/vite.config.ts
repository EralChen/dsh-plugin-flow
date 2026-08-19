import { fileURLToPath, URL } from 'node:url'
import type { OutputChunk, Plugin } from 'vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * The dsh client bundle contract, replicated from the harness source
 * (`.dev/deepseek-harness/packages/client/tsdown.client.ts` +
 * `web/src/platform.ts` — read-only reference). The artifact must call
 * `window.__ModuleLoader__.load({ id, factory })` and resolve the platform
 * modules through the injected `require` (the frozen loader module table).
 * Everything else inlines into the single `lib/client.js`.
 */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  // Documented temporary exemption: the snapshot-store engine lives in
  // runtime until its promotion-time rehoming.
  '@deepseek-ai/dsh-client-runtime/client',
] as const

const ID = 'dshflow'

/**
 * Fold the extracted CSS back into the entry chunk as a plugin-owned
 * <style data-plugin="dshflow"> tag, so the single `lib/client.js` stays
 * self-contained (the loader only fetches JS, and removes plugin-owned
 * style tags on unload).
 */
function inlineCss(): Plugin {
  return {
    name: 'dshflow-inline-css',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        let css = ''
        for (const [name, asset] of Object.entries(bundle)) {
          if (asset.type === 'asset' && name.endsWith('.css')) {
            css += typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source)
            delete bundle[name]
          }
        }
        if (css === '') return
        const entry = Object.values(bundle).find(
          (chunk): chunk is OutputChunk => chunk.type === 'chunk' && chunk.isEntry,
        )
        if (entry === undefined) return
        const inject = [
          "if (typeof document !== 'undefined') {",
          "  const el = document.createElement('style');",
          `  el.dataset.plugin = ${JSON.stringify(ID)};`,
          `  el.textContent = ${JSON.stringify(css)};`,
          '  document.head.appendChild(el);',
          '}',
        ].join('\n')
        entry.code = `${inject}\n${entry.code}`
      },
    },
  }
}

export default defineConfig({
  plugins: [vue(), inlineCss()],
  resolve: {
    alias: {
      '@dshflow/components': fileURLToPath(new URL('../components', import.meta.url)),
      '@dshflow/shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  // Browser bundles inline node-idiom deps (zustand/immer probe
  // process.env.NODE_ENV and import.meta.env.MODE); a CJS output cannot carry
  // import.meta, so substitute here — mirroring the harness client preset.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  build: {
    outDir: '../dshflow/lib',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('src/client/index.ts', import.meta.url)),
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    rollupOptions: {
      external: [...PLATFORM_MODULES],
      output: {
        entryFileNames: 'client.js',
        banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
        footer: 'return module.exports; } });',
        intro: 'var module = { exports: {} }; var exports = module.exports;',
      },
    },
  },
})
