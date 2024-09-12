import type { Import } from '../src/types'
import { describe, expect, it } from 'vitest'
import { stringifyImports } from '../src/utils'

describe('toImports', () => {
  it('basic', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'fooBar', as: 'fooBar' }]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot('"import { fooBar } from \'test-id\';"')
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot('"const { fooBar } = require(\'test-id\');"')
  })

  it('alias', () => {
    const imports: Import[] = [{ from: 'test-id', name: 'foo', as: 'bar' }]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot('"import { foo as bar } from \'test-id\';"')
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot('"const { foo: bar } = require(\'test-id\');"')
  })

  it('multiple', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'foo', as: 'foo' },
      { from: 'test1', name: 'bar', as: 'bar' },
      { from: 'test2', name: 'foobar', as: 'foobar' },
    ]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot(`
        "import { foo, bar } from 'test1';
        import { foobar } from 'test2';"
      `)
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot(`
        "const { foo, bar } = require('test1');
        const { foobar } = require('test2');"
      `)
  })

  it('default', () => {
    const imports: Import[] = [
      { from: 'test1', name: 'default', as: 'foo' },
    ]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot('"import foo from \'test1\';"')
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot('"const { default: foo } = require(\'test1\');"')
  })

  it('import all as', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo' },
    ]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot('"import * as foo from \'test1\';"')
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot('"const foo = require(\'test1\');"')
  })

  it('mixed', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo' },
      { from: 'test1', name: '*', as: 'bar' },
      { from: 'test1', name: 'foo', as: 'foo' },
      { from: 'test1', name: 'bar', as: 'bar' },
      { from: 'test2', name: 'foobar', as: 'foobar' },
      { from: 'test2', name: 'default', as: 'defaultAlias' },
      { from: 'sideeffects', name: '', as: '' },
    ]
    expect(stringifyImports(imports))
      .toMatchInlineSnapshot(`
        "import * as foo from 'test1';
        import * as bar from 'test1';
        import { foo, bar } from 'test1';
        import defaultAlias from 'test2';
        import { foobar } from 'test2';
        import 'sideeffects';"
      `)
    expect(stringifyImports(imports, true))
      .toMatchInlineSnapshot(`
        "const foo = require('test1');
        const bar = require('test1');
        const { foo, bar } = require('test1');
        const { default: defaultAlias } = require('test2');
        const { foobar } = require('test2');
        require('sideeffects');"
      `)
  })

  it('with', () => {
    const imports: Import[] = [
      { from: 'test1', name: '*', as: 'foo', with: { type: 'macro' } },
      { from: 'test1', name: '*', as: 'foo', with: { 'type': 'macro', 'invalid': { value: true }, 'boolean value': true } as any },
      { from: 'test1', name: '*', as: 'bar', with: { type: 'macro' } },
      { from: 'test1', name: 'foo', as: 'foo', with: { type: 'macro' } },
      { from: 'test1', name: 'bar', as: 'bar', with: { type: 'macro' } },
      { from: 'test2', name: 'foobar', as: 'foobar', with: { type: 'macro' } },
      { from: 'test2', name: 'default', as: 'defaultAlias', with: { type: 'macro' } },
      { from: 'sideeffects', name: '', as: '', with: { type: 'macro' } },
    ]

    expect(stringifyImports(imports, false)).toMatchInlineSnapshot(`
      "import * as foo from 'test1' with { type: "macro" };
      import * as foo from 'test1' with { type: "macro", invalid: "[object Object]", "boolean value": "true" };
      import * as bar from 'test1' with { type: "macro" };
      import { foo } from 'test1' with { type: "macro" };
      import { bar } from 'test1' with { type: "macro" };
      import { foobar } from 'test2' with { type: "macro" };
      import defaultAlias from 'test2' with { type: "macro" };
      import 'sideeffects' with { type: "macro" };"
    `)
  })
})
