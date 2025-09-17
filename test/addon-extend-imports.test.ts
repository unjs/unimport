import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('addon extend imports', () => {
  const ctx = createUnimport({
    addons: [
      {
        extendImports(imports) {
          return imports
            .map((i) => {
              if (i.from === 'vue') {
                return {
                  ...i,
                  as: `${i.as}1`,
                  from: 'vue-demi',
                  typeFrom: 'vue',
                }
              }
              return i
            })
        },
      },
    ],
    presets: [
      {
        from: 'vue',
        imports: [
          'ref',
          'computed',
          'watch',
        ],
      },
      {
        from: 'react',
        imports: [
          'useState',
          'useEffect',
        ],
      },
    ],
  })

  it('extendImports', async () => {
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
          const { computed: computed1, ref: ref1, watch: watch1 }: typeof import('vue')
          const { useEffect, useState }: typeof import('react')
        }"
      `)
  })

  it('dynamic extended', async () => {
    expect((await ctx.injectImports('foo1(1)')).code)
      .toMatchInlineSnapshot('"foo1(1)"')

    await ctx.modifyDynamicImports((imports) => {
      imports.push({
        name: 'foo',
        from: 'vue',
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
          const { computed: computed1, foo: foo1, ref: ref1, watch: watch1 }: typeof import('vue')
          const { useEffect, useState }: typeof import('react')
        }"
      `)
  })
})
