import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  outDir: 'dist',
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false,
  },
  externals: [
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-host-webserver',
  ],
})
