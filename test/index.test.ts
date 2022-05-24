import { expect, describe, test } from 'vitest'
import { createUnimport } from '../src'

describe('inject import', () => {
  test('basic', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }]
    })
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot(`
        "import { fooBar } from 'test-id';
        console.log(fooBar())"
      `)
  })
})
