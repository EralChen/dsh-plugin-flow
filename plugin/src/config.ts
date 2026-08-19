/**
 * Plugin configuration. v0 keeps this dependency-free: no schemastery schema,
 * just defaults + light normalization, so the plugin links into a profile
 * without any runtime dependency beyond what dsh already provides.
 * @module @dshflow/plugin/config
 */

/** Raw config the patch row may provide (all optional). */
export interface Config {
  /** URL prefix the visualization is served under (no trailing slash). */
  basePath?: string
  /** Poll interval (ms) used as a safety net for tree-change detection. */
  pollIntervalMs?: number
}

/** Normalized config used at runtime. */
export interface ResolvedConfig {
  basePath: string
  pollIntervalMs: number
}

export const DEFAULT_BASE_PATH = '/dshflow'
export const DEFAULT_POLL_INTERVAL_MS = 2000

export function resolveConfig(config: Config = {}): ResolvedConfig {
  const basePath = (config.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, '') || DEFAULT_BASE_PATH
  const pollIntervalMs = Math.max(100, config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS)
  return { basePath, pollIntervalMs }
}
