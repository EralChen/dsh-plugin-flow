/**
 * dshflow — DeepSeek Harness plugin.
 *
 * Mounts on the `dsh web` webserver and exposes the live Cordis plugin tree
 * as JSON + SSE, plus the `@vunk/flow` visualization that renders it.
 *
 * Namespace plugin (named exports, no default — see the dsh plugin contract).
 * Zero runtime dependencies (cordis/webserver are type-only).
 * @module @dshflow/plugin
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { DEFAULT_BASE_PATH, DEFAULT_POLL_INTERVAL_MS, resolveConfig } from './config'
import type { Config as DshFlowConfig } from './config'
import { registerDshFlowRoutes } from './server'
import { buildDshFlowTree, getServiceDetail } from './tree'

export const name = 'dshflow'
export const inject = ['webServer']

export { buildDshFlowTree, getServiceDetail, resolveConfig, DEFAULT_BASE_PATH, DEFAULT_POLL_INTERVAL_MS }
export type { Config as DshFlowConfig, ResolvedConfig } from './config'
export type * from './types'

export function apply(ctx: Context, config?: DshFlowConfig): void {
  registerDshFlowRoutes(ctx, resolveConfig(config))
}
