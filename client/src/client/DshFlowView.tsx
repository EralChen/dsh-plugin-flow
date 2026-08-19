import { createElement, useEffect, useRef } from 'react'
import { createApp } from 'vue'
import DshFlowPanel from './DshFlowPanel.vue'

/**
 * React tab shell for the dsh conversation view. dsh renders this component
 * through its own React renderer; here it only owns a host <div> and mounts
 * the Vue visualization into it, so the visualization stays Vue without any
 * React rewrite.
 */
export function DshFlowView() {
  const host = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = host.current
    if (el === null) return
    const app = createApp(DshFlowPanel)
    app.mount(el)
    return () => app.unmount()
  }, [])

  return createElement('div', { ref: host, style: { width: '100%', height: '100%', position: "relative" } })
}
