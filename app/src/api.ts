import type { DshFlowServiceDetail, DshFlowTree } from '@dshflow/shared/types/dsh-flow'

const BASE = '/dshflow/'

export async function fetchTree(): Promise<DshFlowTree> {
  const res = await fetch(`${BASE}api/tree`)
  if (!res.ok) throw new Error(`fetchTree: HTTP ${res.status}`)
  return res.json() as Promise<DshFlowTree>
}

export interface StreamHandlers {
  onTree?: (tree: DshFlowTree) => void
}

/** Subscribe to live tree snapshots; returns the unsubscribe function. */
export function subscribe(handlers: StreamHandlers): () => void {
  const source = new EventSource(`${BASE}api/events`)
  source.addEventListener('tree', (event) => {
    handlers.onTree?.(JSON.parse((event as MessageEvent).data) as DshFlowTree)
  })
  return () => source.close()
}

/** Fetch the deep(er) value projection of one live service. */
export async function fetchServiceDetail(name: string): Promise<DshFlowServiceDetail> {
  const res = await fetch(`${BASE}api/service/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`fetchServiceDetail(${name}): HTTP ${res.status}`)
  return res.json() as Promise<DshFlowServiceDetail>
}
