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

// Edge case: multi-declarator without initialiser on first name
// `foo` has no `=`, but should still be exported.
// See: CodeRabbit review on PR #513
export let uninitFoo: string, uninitBar = 'hello'

// Edge case: comparison operator `<` in RHS expression.
// The `<` must not be tracked as an angle bracket, or it hides
// the comma that separates `compA` from `compB`.
// Both `1 < 2` (digit before <) and `foo < bar` (identifier before <)
// must be recognised as comparisons, not generics.
// See: CodeRabbit review on PR #513
export const compA = 1 < 2 ? 'yes' : 'no', compB = 42
const _someNum = 10
export const compC = _someNum < 100 ? 'small' : 'big', compD = 99

// Pin original #502 regression: arrow function with generic params.
// `useResizable` should be exported; `options` (the param) should not.
export const useResizable = <T>(options: { columns: T[] }) => {
  return options
}
