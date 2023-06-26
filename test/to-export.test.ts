import { resolve } from 'path'
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

  it('strip extensions', () => {
    const imports: Import[] = [
      { from: 'test1.ts', name: 'foo', as: 'foo' },
      { from: 'test2.mjs', name: 'foobar', as: 'foobar' }
    ]

    expect(toExports(imports))
      .toMatchInlineSnapshot(`
        "export { foo } from 'test1';
        export { foobar } from 'test2';"
      `)
  })

  it('relative path', () => {
    const root = process.cwd()
    const imports: Import[] = [
      { from: resolve(root, 'foo.ts'), name: 'foo1', as: 'foo1' },
      { from: resolve(root, '../foo.ts'), name: 'foo2', as: 'foo2' },
      { from: resolve(root, 'foo/bar.ts'), name: 'foo3', as: 'foo3' }
    ]
    expect(toExports(imports, root))
      .toMatchInlineSnapshot(`
        "export { foo1 } from './foo';
        export { foo2 } from '../foo';
        export { foo3 } from './foo/bar';"
      `)
  })

  it('include type', () => {
    const root = process.cwd()
    const imports: Import[] = [
      { from: 'vue', name: 'ref', as: 'ref' },
      { from: 'vue', name: 'Ref', as: 'Ref', type: true }
    ]
    expect(toExports(imports, root))
      .toMatchInlineSnapshot('"export { ref } from \'vue\';"')

    expect(toExports(imports, root, true))
      .toMatchInlineSnapshot('"export { ref, Ref } from \'vue\';"')
  })
})
