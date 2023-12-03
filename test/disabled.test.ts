import { describe, expect, it } from 'vitest'
import type { Import } from '../src'
import { createUnimport } from '../src'

describe('able to disable', () => {
  const item: Import = { name: 'fooBar', from: 'test-id' }
  const { injectImports } = createUnimport({
    imports: [item],
  })
  it('disable: false', async () => {
    item.disabled = false
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot(`
        "import { fooBar } from 'test-id';
        console.log(fooBar())"
      `)
  })
  it('disable: true', async () => {
    item.disabled = true
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot('"console.log(fooBar())"')
  })
  it('multiple imports', async () => {
    const item2 = { name: item.name, from: 'other-id', disabled: false }
    const { injectImports } = createUnimport({
      imports: [item, item2],
    })
    item.disabled = true
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot(`
        "import { fooBar } from 'other-id';
        console.log(fooBar())"
      `)
  })
})
