import { expect, describe, test } from 'vitest'
import { createUnimport } from '../src'

describe('unimport', () => {
  test('Adds basic import', () => {
    const { addImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }]
    })
    expect(addImports('console.log(fooBar())').code)
      .toMatchInlineSnapshot('"import { fooBar } from \'test-id\';console.log(fooBar())"')
  })
})
