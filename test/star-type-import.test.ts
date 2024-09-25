import { describe, expect, it } from 'vitest'
import { toTypeReExports } from '../src'

// when imports element is { type: true, name: '*', as: 'bar' } export will be...
// old behavior: export type { default as bar } from 'foo'
// new behavior: export type * as bar from 'foo'
// to save previous behavior, user must rename `name` property from '*' to 'default'
// NOTE: with new behavior user should provide `as` property,
// `  export type * from 'foo'` is invalid
// NOTE: star type import can not be on same line with same `from` property :
// `
//   export type * as bar, type { baz } from 'foo'
// ` is invalid`
// `
//   export type * as bar from 'foo'
//   export type { baz } from 'foo'
// ` is valid

describe('star type import', () => {
  it.todo('would not be added if there is no "as" property', () => {
    const invalidImport = {
      from: 'foo-lib',
      name: '*',
      type: true,
    }
    const res = toTypeReExports([invalidImport])
    expect(res.length).toBe(0)
  })
  it.todo('with other type imports will not be on same line')
})
