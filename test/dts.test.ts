import { expect, it } from 'vitest'
import { createUnimport } from '../src'

it('dts', async () => {
  const cwd = process.cwd().replace(/\\/g, '/')
  const { generateTypeDeclarations, init } = createUnimport({
    imports: [
      { name: 'default', from: 'default', as: 'customDefault' },
      { name: 'foobar', from: 'foobar', as: 'foobar' },
      { name: 'doTheThing', from: 'my-macro-library', with: { type: 'macro' } },
    ],
    presets: [
      {
        from: 'vue',
        imports: [
          'ref',
          'reactive',
          'computed',
          'toRefs',
          {
            name: 'Ref',
            type: true,
          },
          {
            name: 'ComputedRef',
            type: true,
          },
        ],
      },
      {
        from: 'three',
        imports: [['*', 'THREE']],
      },
      {
        from: 'react',
        imports: ['useState', 'useEffect', 'useRef'],
      },
      {
        from: 'jquery',
        imports: [
          '$',
          {
            name: 'JQuery',
            type: true,
          },
        ],
      },
    ],
    dirs: [
      './playground/composables/**',
    ],
    dirsScanOptions: {
      cwd,
    },
  })

  await init()

  expect(
    (await generateTypeDeclarations()).replaceAll(cwd, '<root>'),
  )
    .toMatchInlineSnapshot(`
      "export {}
      declare global {
        const THREE: typeof import('three')
        const { $ }: typeof import('jquery')
        const { CustomEnum, bump, localA, localBAlias, multiplier, useDoubled }: typeof import('<root>/playground/composables/index')
        const { PascalCased }: typeof import('<root>/playground/composables/PascalCased')
        const { bar, named }: typeof import('<root>/playground/composables/nested/bar/index')
        const { computed, reactive, ref, toRefs }: typeof import('vue')
        const { default: customDefault }: typeof import('default')
        const { default: foo }: typeof import('<root>/playground/composables/foo')
        const { default: nested }: typeof import('<root>/playground/composables/nested/index')
        const { doTheThing }: typeof import('my-macro-library', { with: { type: "macro" } })
        const { foobar }: typeof import('foobar')
        const { myBazFunction }: typeof import('<root>/playground/composables/nested/bar/baz')
        const { myfunc1, myfunc2 }: typeof import('<root>/playground/composables/nested/bar/named')
        const { subFoo }: typeof import('<root>/playground/composables/nested/bar/sub/index')
        const { useEffect, useRef, useState }: typeof import('react')
        const { vanillaA, vanillaAMJS, vanillaB, vanillaBMJS }: typeof import('<root>/playground/composables/vanilla')
      }
      // for type re-export
      declare global {
        // @ts-ignore
        export type { Ref, ComputedRef } from 'vue'
        import('vue')
        // @ts-ignore
        export type { JQuery } from 'jquery'
        import('jquery')
        // @ts-ignore
        export type { PascalCased } from '<root>/playground/composables/PascalCased'
        import('<root>/playground/composables/PascalCased')
        // @ts-ignore
        export type { CustomEnum, CustomType1, CustomInterface1 } from '<root>/playground/composables/index'
        import('<root>/playground/composables/index')
        // @ts-ignore
        export type { CustomType2 } from '<root>/playground/composables/nested/bar/sub/index'
        import('<root>/playground/composables/nested/bar/sub/index')
        // @ts-ignore
        export type { CustomType3 } from '<root>/playground/composables/nested/index'
        import('<root>/playground/composables/nested/index')
        // @ts-ignore
        export type { vanillaTypeOnlyFunction, VanillaInterface, VanillaInterfaceAlias } from '<root>/playground/composables/vanilla.d'
        import('<root>/playground/composables/vanilla.d')
      }"
    `)
})

it('should compat with `export =`', async () => {
  const { generateTypeDeclarations, init } = createUnimport({
    imports: [
      { name: '=', as: 'browser', from: 'webextension-polyfill' },
    ],
  })

  await init()

  await expect(generateTypeDeclarations()).resolves.toMatchInlineSnapshot(`
    "export {}
    declare global {
      const browser: typeof import('webextension-polyfill')
    }"
  `)
})
