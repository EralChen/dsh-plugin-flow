/**
 * dshflow HTTP/SSE client. The base path is pinned to the plugin's default
 * (`/dshflow/`); a configurable base is deferred.
 */
import type { DshFlowTree } from '@dshflow/shared/types/dsh-flow'

const BASE = '/dshflow/'

export async function fetchTree(): Promise<DshFlowTree> {
  const res = await fetch(`${BASE}api/tree`)
  if (!res.ok) throw new Error(`fetchTree: HTTP ${res.status}`)
  return res.json() as Promise<DshFlowTree>
}

/** Subscribe to live tree snapshots; returns the unsubscribe function. */
export function subscribeTree(onTree: (tree: DshFlowTree) => void): () => void {
  const source = new EventSource(`${BASE}api/events`)
  source.addEventListener('tree', (event) => {
    onTree(JSON.parse((event as MessageEvent).data) as DshFlowTree)
  })
  return () => source.close()
}
