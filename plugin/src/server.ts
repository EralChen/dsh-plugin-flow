/**
 * HTTP surface over the dsh webserver (`ctx.webServer`):
 * - `{basePath}/api/tree`   — JSON snapshot
 * - `{basePath}/api/events` — SSE stream pushing a snapshot on every change
 * - `{basePath}/*`          — the built Vue visualization (SPA fallback)
 * @module dshflow/server
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-agent'
import type { ResolvedConfig } from './config'
import { sendDebugMessage } from './debug'
import { buildDshFlowTree, getServiceDetail } from './tree'
import type { DshFlowTree } from './types'

/** Bundled frontend dist, resolved relative to this plugin's own location. */
const DIST_INDEX = fileURLToPath(new URL('../web/index.html', import.meta.url))
const DIST_ROOT = dirname(DIST_INDEX)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendJson(res: ServerResponse, data: unknown): void {
  const body = JSON.stringify(data, null, 2)
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  let body = ''
  for await (const chunk of req) body += chunk
  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Minimal SPA static server: traversal is 403, misses fall back to index.html. */
async function serveStatic(sub: string, res: ServerResponse): Promise<void> {
  if (!existsSync(DIST_INDEX)) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end('dshflow: frontend dist not built — run `pnpm -C app build`, then rebuild the plugin.')
    return
  }
  const target = resolve(normalize(join(DIST_ROOT, sub)))
  if (target !== DIST_ROOT && !target.startsWith(DIST_ROOT + sep)) {
    res.writeHead(403)
    res.end()
    return
  }
  const index = (): Promise<void> =>
    readFile(DIST_INDEX).then((body) => {
      res.writeHead(200, { 'content-type': MIME['.html'] })
      res.end(body)
    })
  if (target === DIST_ROOT || target === DIST_INDEX) {
    await index()
    return
  }
  try {
    const body = await readFile(target)
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    await index()
  }
}

/** Register every dshflow route on the shared webserver and the change feed. */
export function registerDshFlowRoutes(ctx: Context, config: ResolvedConfig): void {
  const base = config.basePath.replace(/\/+$/, '') || '/dshflow'
  const clients = new Set<ServerResponse>()
  let lastTreeSnapshot: DshFlowTree | undefined
  let lastTreeKey = ''

  const broadcast = (tree: DshFlowTree): void => {
    const message = `event: tree\ndata: ${JSON.stringify(tree)}\n\n`
    for (const res of clients) {
      try {
        res.write(message)
      } catch {
        clients.delete(res)
      }
    }
  }

  const rebuild = (): void => {
    let tree: DshFlowTree
    try {
      tree = buildDshFlowTree(ctx)
    } catch (error) {
      ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
      return
    }
    // `generatedAt` changes every rebuild; compare the structural part only.
    const key = JSON.stringify({ root: tree.root, services: tree.services })
    if (key === lastTreeKey) return
    lastTreeKey = key
    lastTreeSnapshot = tree
    broadcast(tree)
  }

  const openEvents = (req: IncomingMessage, res: ServerResponse): void => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    })
    if (lastTreeSnapshot !== undefined) res.write(`event: tree\ndata: ${JSON.stringify(lastTreeSnapshot)}\n\n`)
    clients.add(res)
    req.on('close', () => clients.delete(res))
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://x')
    const pathname = url.pathname
    const sub = pathname.slice(base.length) || '/'
    if (sub === '/api/tree') {
      sendJson(res, buildDshFlowTree(ctx))
      return
    }
    if (sub === '/api/debug' && req.method === 'POST') {
      const body = await readJsonBody(req)
      const result = sendDebugMessage(ctx, String(body.text ?? ''))
      if (!result.ok) {
        res.writeHead(409, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(result))
        return
      }
      sendJson(res, result)
      return
    }
    if (sub === '/api/events') {
      openEvents(req, res)
      return
    }
    const serviceMatch = /^\/api\/service\/([^/]+)$/.exec(sub)
    if (serviceMatch !== null) {
      const detail = getServiceDetail(ctx, decodeURIComponent(serviceMatch[1]!))
      if (detail === undefined) {
        res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: 'service not found' }))
        return
      }
      sendJson(res, detail)
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end()
      return
    }
    await serveStatic(sub, res)
  }

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: base, handler }),
    'dshflow: routes',
  )

  // Change feed: react to cordis lifecycle events (debounced), plus a poll
  // safety net that also keeps SSE connections from going idle.
  let debounce: ReturnType<typeof setTimeout> | undefined
  const schedule = (): void => {
    if (debounce !== undefined) return
    debounce = setTimeout(() => {
      debounce = undefined
      rebuild()
    }, 100)
  }
  ctx.on('internal/plugin', schedule)
  ctx.on('internal/status', schedule)

  ctx.effect(() => {
    rebuild()
    const id = setInterval(() => {
      rebuild()
      for (const res of clients) {
        try {
          res.write(': ping\n\n')
        } catch {
          clients.delete(res)
        }
      }
    }, config.pollIntervalMs)
    return () => clearInterval(id)
  }, 'dshflow: poll')

  ctx.effect(() => () => {
    for (const res of clients) {
      try {
        res.end()
      } catch {
        /* already gone */
      }
    }
    clients.clear()
  }, 'dshflow: sse cleanup')
}
