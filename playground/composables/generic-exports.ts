// Regression test: mlly's regex parser may capture type identifiers from
// generic type parameters as export names. These should not leak into
// auto-imports. See: https://github.com/unjs/unimport/issues/502
import type { Ref } from 'vue'

export const useGenericStore = <T extends Record<string, Ref>>({ params }: { params: T }) => {
  return params
}

export const mergeObjects = <A extends object, B extends object>(a: A, b: B) => ({
  ...a,
  ...b,
})
