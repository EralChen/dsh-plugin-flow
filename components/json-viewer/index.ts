import type { App } from 'vue'
import DshJsonViewer from './src/index.vue'

DshJsonViewer.install = (app: App): void => {
  app.component(DshJsonViewer.name || 'DshJsonViewer', DshJsonViewer)
}

export { DshJsonViewer }
export default DshJsonViewer
