import { expect, describe, test } from 'vitest'
import { createUnimport, Import } from '../src'

describe('able to disable', () => {
  const item: Import = { name: 'fooBar', from: 'test-id' }
  const { injectImports } = createUnimport({
    imports: [item]
  })
  test('disable: false', async () => {
    item.disabled = false
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot('"import { fooBar } from \'test-id\';console.log(fooBar())"')
  })
  test('disable: true', async () => {
    item.disabled = true
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot('"console.log(fooBar())"')
  })
})
