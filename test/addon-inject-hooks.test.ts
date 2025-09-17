import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'
import { functionWrapAddon } from './share'

describe('addon inject hooks', () => {
  const ctx = createUnimport({
    addons: [
      functionWrapAddon(),
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

  it('inject', async () => {
    expect((await ctx.injectImports('ref(1)')).code)
      .toMatchInlineSnapshot(`
        "import { ref as _$_ref } from 'vue';
        import { __helper } from "helper"
        const ref = __helper(_$_ref)

        ref(1)"
      `)

    expect((await ctx.injectImports('ref1(1)')).code)
      .toMatchInlineSnapshot('"ref1(1)"')

    expect(await ctx.generateTypeDeclarations())
      .toMatchInlineSnapshot(`
        "export {}
        declare global {
          const { computed, ref, watch }: typeof import('vue')
          const { useEffect, useState }: typeof import('react')
        }"
      `)
  })

  it('dynamic inject', async () => {
    expect((await ctx.injectImports('foo(1)')).code)
      .toMatchInlineSnapshot('"foo(1)"')

    await ctx.modifyDynamicImports((imports) => {
      imports.push({
        name: 'bar',
        as: 'foo',
        from: 'vue',
      })
    })

    expect((await ctx.injectImports('foo(1)')).code)
      .toMatchInlineSnapshot(`
        "import { bar as _$_foo } from 'vue';
        import { __helper } from "helper"
        const foo = __helper(_$_foo)

        foo(1)"
      `)
  })
})
