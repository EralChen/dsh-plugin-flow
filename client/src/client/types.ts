/**
 * Minimal structural type for the cordis client context, matching the service
 * surface the tab actually uses. Kept local so the client half carries zero
 * runtime (and zero type) dependencies on the harness's client packages.
 */

export interface LocaleService {
  register(ns: string, dicts: Record<string, Record<string, string>>): void
  bind(ns: string): (key: string) => string
}

export interface SlotsService {
  inject(slot: string, factory: () => unknown): void
  register(options: Record<string, unknown>, component: unknown): unknown
}

export interface ClientContext {
  effect(fn: () => void, id?: string): void
  locale: LocaleService
  slots: SlotsService
}
