import { describe, expect, it } from 'vitest'
import { createUnimport, toTypeReExports } from '../src'

// when imports element is { from: 'foo-lib', name: '*', as: 'Foo', type: true  } export will be...
// - old behavior: `export type { default as Foo } from 'foo-lib'`
// - new behavior: `export type * as Foo from 'foo-lib'`
// to save old behavior, user must rename `name` property from '*' to 'default'
// NOTE: with new behavior user should provide `as` property, otherwise it will not be added
//  `export type * from 'foo-lib'` is invalid
// NOTE: wildcard type import can not be on same line with named type imports when `from` property is same
// `
//   export type * as Foo, type { Baz } from 'foo-lib'
// ` is invalid
// `
//   export type * as Foo from 'foo-lib'
//   export type { Baz } from 'foo-lib'
// ` is valid

describe('star type import', () => {
  it('will not be added if there is no "as" property', () => {
    const invalidImport = {
      from: 'foo-lib',
      name: '*',
      type: true,
    }
    const typeReExports = toTypeReExports([invalidImport])
    expect(typeReExports).toMatchInlineSnapshot(`
      "// for type re-export
      declare global {

      }"
    `)
  })

  it('will work with default export', () => {
    const typeReExports = toTypeReExports([
      {
        from: 'foo-lib',
        name: '*',
        type: true,
        as: 'Foo',
      },
      {
        from: 'foo-lib',
        name: 'default',
        type: true,
        as: 'D',
      },
    ])
    expect(typeReExports).toMatchInlineSnapshot(`
      "// for type re-export
      declare global {
        // @ts-ignore
        export type { default as D } from 'foo-lib'
        // @ts-ignore
        export type * as Foo from 'foo-lib'
        import('foo-lib')
      }"
    `)
  })

  it('will not be added if there is multiple invalid imports', () => {
    const invalidImports = [
      {
        from: 'foo-lib',
        name: '*',
        type: true,
      },
      {
        from: 'foo-lib',
        name: '*',
        type: true,
        as: '',
      },
    ]
    const typeReExports = toTypeReExports(invalidImports)
    expect(typeReExports).toMatchInlineSnapshot(`
      "// for type re-export
      declare global {

      }"
    `)
  })

  it('will work with other non-star type imports, which will not be on same line', () => {
    const typeReExports = toTypeReExports([
      {
        from: 'foo-lib',
        name: '*',
        type: true,
        as: 'Foo',
      },
      {
        from: 'foo-lib',
        name: 'Baz',
        type: true,
      },
      {
        from: 'foo-lib',
        name: 'Quz',
        as: 'Q',
        type: true,
      },
    ])
    expect(typeReExports).toMatchInlineSnapshot(`
      "// for type re-export
      declare global {
        // @ts-ignore
        export type { Baz, Quz as Q } from 'foo-lib'
        // @ts-ignore
        export type * as Foo from 'foo-lib'
        import('foo-lib')
      }"
    `)
  })

  it('works with multiple star type imports', () => {
    const typeReExports = toTypeReExports([
      {
        from: 'foo-lib',
        name: '*',
        type: true,
        as: 'Foo',
      },
      {
        from: 'bar-lib',
        name: '*',
        type: true,
        as: 'Bar',
      },
    ])
    expect(typeReExports).toMatchInlineSnapshot(`
      "// for type re-export
      declare global {
        // @ts-ignore
        export type * as Foo from 'foo-lib'
        import('foo-lib')
        // @ts-ignore
        export type * as Bar from 'bar-lib'
        import('bar-lib')
      }"
    `)
  })

  it(`will not be injected in code but will be in dts`, async () => {
    const { injectImports, generateTypeDeclarations } = createUnimport({
      imports: [{ name: '*', from: 'todo-lib', as: 'Todo', type: true }],
    })
    const typeDeclarations = await generateTypeDeclarations()
    expect(typeDeclarations).toMatchInlineSnapshot(`
      "export {}
      declare global {

      }
      // for type re-export
      declare global {
        // @ts-ignore
        export type * as Todo from 'todo-lib'
        import('todo-lib')
      }"
    `)
    const withInjectedImports = await injectImports(`const title: Todo.Title = 'Todo Title' `)
    expect(withInjectedImports.code).toMatchInlineSnapshot(`"const title: Todo.Title = 'Todo Title' "`)
  })
})
