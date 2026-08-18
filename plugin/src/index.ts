/**
 * dshflow — DeepSeek Harness plugin.
 *
 * Mounts on the `dsh web` webserver and exposes the live Cordis plugin tree
 * as JSON + SSE, plus the `@vunk/flow` visualization that renders it.
 *
 * Namespace plugin (named exports, no default — see the dsh plugin contract).
 * @module dshflow
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { Config } from './config'
import type { Config as DshFlowConfig } from './config'
import { registerDshFlowRoutes } from './server'
import { buildDshFlowTree } from './tree'

export const name = 'dshflow'
export const inject = ['webServer']

export { Config, buildDshFlowTree }
export type { Config as DshFlowConfig }
export type * from './types'

export function apply(ctx: Context, config: DshFlowConfig): void {
  registerDshFlowRoutes(ctx, config)
}
