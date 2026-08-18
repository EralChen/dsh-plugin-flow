/**
 * Plugin configuration schema and type.
 * @module dshflow/config
 */

import z from '@deepseek-ai/schemastery'

/** Runtime configuration, validated by the Cordis loader. */
export interface Config {
  /** URL prefix the visualization is served under (no trailing slash). */
  basePath: string
  /** Poll interval (ms) used as a safety net for tree-change detection. */
  pollIntervalMs: number
}

export const Config: z<Config> = z.object({
  basePath: z.string().default('/dshflow'),
  pollIntervalMs: z.number().step(1).min(100).default(2000),
})
