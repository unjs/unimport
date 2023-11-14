import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vue/macros',
  imports: [
    // https://vuejs.org/guide/extras/reactivity-transform.html#refs-vs-reactive-variables
    '$',
    '$$',
    '$ref',
    '$shallowRef',
    '$toRef',
    '$customRef',
    '$computed',
  ],
})
