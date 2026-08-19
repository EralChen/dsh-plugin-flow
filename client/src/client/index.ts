import '@logicflow/core/dist/index.css'
import '@vunk/flow/index.css'
import { DshFlowView } from './DshFlowView'
import { en, NS, zh } from './locales'
import type { ClientContext } from './types'

/** Required services: the conversation view slot, sessions, and the locale service. */
export const inject = ['slots', 'sessions', 'locale']

/**
 * Client plugin body: register the dshflow view tab as a sibling of the
 * trajectory tab. The registration rides the slot service's effect wrapper so
 * a plugin unload removes the tab again.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-dshflow: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'dshflow',
    order: 20,
    locale: NS,
    label: () => t('view.dshflow'),
  }, DshFlowView))
}
