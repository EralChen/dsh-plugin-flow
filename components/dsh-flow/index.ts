import type { App } from 'vue'
import DshFlow from './src/index.vue'

export * from './src/graph'

DshFlow.install = (app: App): void => {
  app.component(DshFlow.name || 'DshFlow', DshFlow)
}

export { DshFlow }
export default DshFlow
