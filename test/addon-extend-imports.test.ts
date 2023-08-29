import { expect, describe, test } from 'vitest'
import { createUnimport } from '../src'

describe('addon extend imports', () => {
  const ctx = createUnimport({
    addons: [
      {
        extendImports (imports) {
          return imports
            .map((i) => {
              if (i.from === 'vue') {
                return {
                  ...i,
                  as: i.as + '1',
                  from: 'vue-demi',
                  typeFrom: 'vue'
                }
              }
              return i
            })
        }
      }
    ],
    presets: [
      {
        from: 'vue',
        imports: [
          'ref',
          'computed',
          'watch'
        ]
      },
      {
        from: 'react',
        imports: [
          'useState',
          'useEffect'
        ]
      }
    ]
  })

  test('extendImports', async () => {
    expect((await ctx.injectImports('ref(1)')).code)
      .toMatchInlineSnapshot('"ref(1)"')

    expect((await ctx.injectImports('ref1(1)')).code)
      .toMatchInlineSnapshot(`
        "import { ref as ref1 } from 'vue-demi';
        ref1(1)"
      `)

    expect(await ctx.generateTypeDeclarations())
      .toMatchInlineSnapshot(`
        "export {}
        declare global {
          const computed1: typeof import('vue')['computed']
          const ref1: typeof import('vue')['ref']
          const useEffect: typeof import('react')['useEffect']
          const useState: typeof import('react')['useState']
          const watch1: typeof import('vue')['watch']
        }"
      `)
  })

  test('dynamic extended', async () => {
    expect((await ctx.injectImports('foo1(1)')).code)
      .toMatchInlineSnapshot('"foo1(1)"')

    await ctx.modifyDynamicImports((imports) => {
      imports.push({
        name: 'foo',
        from: 'vue'
      })
    })

    expect((await ctx.injectImports('foo1(1)')).code)
      .toMatchInlineSnapshot(`
        "import { foo as foo1 } from 'vue-demi';
        foo1(1)"
      `)

    expect(await ctx.generateTypeDeclarations())
      .toMatchInlineSnapshot(`
        "export {}
        declare global {
          const computed1: typeof import('vue')['computed']
          const foo1: typeof import('vue')['foo']
          const ref1: typeof import('vue')['ref']
          const useEffect: typeof import('react')['useEffect']
          const useState: typeof import('react')['useState']
          const watch1: typeof import('vue')['watch']
        }"
      `)
  })
})
