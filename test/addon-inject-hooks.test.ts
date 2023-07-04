import { expect, describe, test } from 'vitest'
import { createUnimport } from '../src'

describe('addon inject hooks', () => {
  const ctx = createUnimport({
    addons: [
      {
        injectImportsResolved (imports) {
          return imports
            .map((i) => {
              if (i.from === 'vue') {
                return {
                  ...i,
                  meta: {
                    originalAs: (i.as || i.name)
                  },
                  as: '__' + (i.as || i.name) + '__'
                }
              }
              return i
            })
        },
        injectImportsStringified (str, imports) {
          const injected = imports.filter(i => i.meta?.originalAs)
          if (injected.length) {
            return [
              str,
              'import { __helper } from "helper"',
              injected.map(i => `const ${i.meta!.originalAs} = __helper(${i.as})`).join('\n')
            ].join('\n')
          }
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

  test('inject', async () => {
    expect((await ctx.injectImports('ref(1)')).code)
      .toMatchInlineSnapshot(`
        "import { ref as __ref__ } from 'vue';
        import { __helper } from \\"helper\\"
        const ref = __helper(__ref__)
        ref(1)"
      `)

    expect((await ctx.injectImports('ref1(1)')).code)
      .toMatchInlineSnapshot('"ref1(1)"')

    expect(await ctx.generateTypeDeclarations())
      .toMatchInlineSnapshot(`
        "export {}
        declare global {
          const computed: typeof import('vue')['computed']
          const ref: typeof import('vue')['ref']
          const useEffect: typeof import('react')['useEffect']
          const useState: typeof import('react')['useState']
          const watch: typeof import('vue')['watch']
        }"
      `)
  })

  test('dynamic inject', async () => {
    expect((await ctx.injectImports('foo(1)')).code)
      .toMatchInlineSnapshot('"foo(1)"')

    await ctx.modifyDynamicImports((imports) => {
      imports.push({
        name: 'bar',
        as: 'foo',
        from: 'vue'
      })
    })

    expect((await ctx.injectImports('foo(1)')).code)
      .toMatchInlineSnapshot(`
        "import { bar as __foo__ } from 'vue';
        import { __helper } from \\"helper\\"
        const foo = __helper(__foo__)
        foo(1)"
      `)
  })
})
