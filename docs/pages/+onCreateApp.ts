import { ID_INJECTION_KEY } from "element-plus";
import type { PageContext } from 'vike/types'
import { createAppI18n } from '../i18n'
import { Locale, localeMap } from '../api/locale'

function resolveUrlLocale(urlPathname: string): Locale {
  const firstPath = urlPathname.split('/').filter(Boolean)[0]
  return firstPath && firstPath in localeMap ? firstPath as Locale : Locale.enUS
}

function onCreateApp(ctx: PageContext) {
  if (!ctx.app) return
  
  ctx.app.provide(ID_INJECTION_KEY, {
    prefix: 1024,
    current: 0,
  });
  ctx.app.use(createAppI18n(resolveUrlLocale(ctx.urlPathname)))

}

export { onCreateApp };