import { createI18n } from 'vue-i18n'
import { localeOptions, Locale } from '../api/locale'


export function createAppI18n(locale: Locale = Locale.enUS) {
  return createI18n({
    legacy: false,
    locale,
    availableLocales: localeOptions.map((option) => option.value),
    messages: { // 必须有对应key， 才能激活 availableLocales
      [Locale.zhCN]: {},
      [Locale.enUS]: {},
    }
  })
}