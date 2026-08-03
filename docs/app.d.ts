import 'vike-vue-content/config'
import 'vike-vue/config'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
  }
}



// Add this line if TypeScript complains about `declare global`.
// https://typescriptlang.org/docs/handbook/2/modules.html#how-javascript-modules-are-defined
export {}