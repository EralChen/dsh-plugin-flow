import type { App } from 'vue'
import DshNode from './src/index.vue'

DshNode.install = (app: App): void => {
  app.component(DshNode.name || 'DshNode', DshNode)
}

export { DshNode }
export default DshNode
