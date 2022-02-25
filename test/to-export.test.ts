import { describe, it, expect } from 'vitest'
import { Import } from '../src/types'
import { toExports } from '../src/utils'

describe('toExports', () => {
  it('basic', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'fooBar', as: 'fooBar' }]
    expect(toExports(imports))
      .toMatchInlineSnapshot('"export { fooBar } from \'test-id\';"')
  })

  it('alias', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'foo', as: 'bar' }]
    expect(toExports(imports))
      .toMatchInlineSnapshot('"export { foo as bar } from \'test-id\';"')
  })

  it('multiple', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'foo', as: 'foo' },
      { from: 'test1', name: 'bar', as: 'bar' },
      { from: 'test2', name: 'foobar', as: 'foobar' }
    ]
    expect(toExports(imports))
      .toMatchInlineSnapshot(`
        "export { foo, bar } from 'test1';
        export { foobar } from 'test2';"
      `)
  })

  it('default', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'default', as: 'foo' }
    ]
    expect(toExports(imports))
      .toMatchInlineSnapshot('"export { default as foo } from \'test1\';"')
  })

  it('import all as', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo' }
    ]
    expect(toExports(imports))
      .toMatchInlineSnapshot('"export * as foo from \'test1\';"')
  })

  it('mixed', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo' },
      { from: 'test1', name: '*', as: 'bar' },
      { from: 'test1', name: 'foo', as: 'foo' },
      { from: 'test1', name: 'bar', as: 'bar' },
      { from: 'test2', name: 'foobar', as: 'foobar' },
      { from: 'test2', name: 'default', as: 'defaultAlias' }
    ]
    expect(toExports(imports))
      .toMatchInlineSnapshot(`
        "export * as foo from 'test1';
        export * as bar from 'test1';
        export { foo, bar } from 'test1';
        export { foobar, default as defaultAlias } from 'test2';"
      `)
  })
})
