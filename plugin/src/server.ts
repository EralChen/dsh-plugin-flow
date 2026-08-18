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
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type { Config } from './config'
import { buildDshFlowTree } from './tree'
import type { DshFlowTree } from './types'

/** Bundled frontend dist, resolved relative to this plugin's own location. */
const DIST_ROOT = fileURLToPath(new URL('../web/', import.meta.url))
const DIST_INDEX = join(DIST_ROOT, 'index.html')

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
export function registerDshFlowRoutes(ctx: Context, config: Config): void {
  const base = config.basePath.replace(/\/+$/, '') || '/dshflow'
  const clients = new Set<ServerResponse>()
  let lastJson = ''

  const broadcast = (tree: DshFlowTree): void => {
    const payload = `event: tree\ndata: ${JSON.stringify(tree)}\n\n`
    for (const res of clients) {
      try {
        res.write(payload)
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
    const json = JSON.stringify(tree)
    if (json === lastJson) return
    lastJson = json
    broadcast(tree)
  }

  const openEvents = (req: IncomingMessage, res: ServerResponse): void => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    })
    if (lastJson !== '') res.write(`event: tree\ndata: ${lastJson}\n\n`)
    clients.add(res)
    req.on('close', () => clients.delete(res))
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const pathname = new URL(req.url ?? '/', 'http://x').pathname
    const sub = pathname.slice(base.length) || '/'
    if (sub === '/api/tree') {
      sendJson(res, buildDshFlowTree(ctx))
      return
    }
    if (sub === '/api/events') {
      openEvents(req, res)
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
