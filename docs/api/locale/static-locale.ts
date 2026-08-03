import { enUS, zhCN, type Language } from 'vike-vue-content/locale'

export enum Locale {
  zhCN = 'zh-CN',
  enUS = 'en-US',
}

export interface LocaleMedia {
  value: Locale
  label: string
  contentLocale: Language
}

export const localeOptions: LocaleMedia[] = [
  { 
    value: Locale.zhCN,
    label: '简体中文', 
    contentLocale: zhCN
  },
  { 
    value: Locale.enUS, 
    label: 'English', 
    contentLocale: enUS
  },
]

export const localeMap = localeOptions.reduce((map, option) => {
  map[option.value] = option
  return map
}, {} as Record<Locale, LocaleMedia>)
