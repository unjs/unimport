import { Ref } from 'vue'

export const multiplier = ref(2)

export function useDoubled (v: Ref<number>) {
  return computed(() => v.value * multiplier.value)
}

export function bump () {
  multiplier.value += 1
}

const localA = 'localA'
const localB = 'localB'

export {
  localA,
  localB as localBAlias
}
