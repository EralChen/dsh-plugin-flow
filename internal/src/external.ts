import { LIB_ALIAS, LIB_NAME } from './name'

export const external = [
  'vue',
  'vue-router',
  'element-plus',
  'mobx',
  'mitt',
  new RegExp(`^${LIB_NAME}`),
  new RegExp(`^${LIB_ALIAS}`),
  /^@vunk\//,
  /^@dshflow\//,
  /^@logicflow\//,
  /^@vueuse\//,
  /^@element-plus\//,
]
