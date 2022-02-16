import { describe, it, expect } from 'vitest'
import { Import } from '../src/types'
import { toImports } from '../src/utils'

describe('toImports', () => {
  it('basic', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'fooBar', as: 'fooBar' }]
    expect(toImports(imports))
      .toMatchInlineSnapshot('"import { fooBar } from \'test-id\';"')
    expect(toImports(imports, true))
      .toMatchInlineSnapshot('"const { fooBar } = require(\'test-id\');"')
  })

  it('alias', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'foo', as: 'bar' }]
    expect(toImports(imports))
      .toMatchInlineSnapshot('"import { foo as bar } from \'test-id\';"')
    expect(toImports(imports, true))
      .toMatchInlineSnapshot('"const { foo : bar } = require(\'test-id\');"')
  })

  it('multiple', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'foo', as: 'foo' },
      { from: 'test1', name: 'bar', as: 'bar' },
      { from: 'test2', name: 'foobar', as: 'foobar' }
    ]
    expect(toImports(imports))
      .toMatchInlineSnapshot(`
        "import { foo, bar } from 'test1';
        import { foobar } from 'test2';"
      `)
    expect(toImports(imports, true))
      .toMatchInlineSnapshot(`
        "const { foo, bar } = require('test1');
        const { foobar } = require('test2');"
      `)
  })

  it('default', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'default', as: 'foo' }
    ]
    expect(toImports(imports))
      .toMatchInlineSnapshot('"import { default as foo } from \'test1\';"')
    expect(toImports(imports, true))
      .toMatchInlineSnapshot('"const { default : foo } = require(\'test1\');"')
  })

  it('import all as', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo' }
    ]
    expect(toImports(imports))
      .toMatchInlineSnapshot('"import { * as foo } from \'test1\';"')
    expect(toImports(imports, true))
      .toMatchInlineSnapshot('"const { * : foo } = require(\'test1\');"')
  })
})
