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
      {
        from: 'pkg/src',
        typeFrom: 'pkg/dts',
        imports: ['pkg'],
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
        const $: typeof import('jquery').$
        const BAR: typeof import('<root>/playground/composables/comma-separated').BAR
        const CustomEnum: typeof import('<root>/playground/composables/index').CustomEnum
        const FOO: typeof import('<root>/playground/composables/comma-separated').FOO
        const PascalCased: typeof import('<root>/playground/composables/PascalCased').PascalCased
        const THREE: typeof import('three')
        const bar: typeof import('<root>/playground/composables/nested/bar/index').bar
        const bump: typeof import('<root>/playground/composables/index').bump
        const computed: typeof import('vue').computed
        const customDefault: typeof import('default').default
        const doTheThing: typeof import('my-macro-library', { with: { type: "macro" } }).doTheThing
        const foo: typeof import('<root>/playground/composables/foo').default
        const foobar: typeof import('foobar').foobar
        const localA: typeof import('<root>/playground/composables/index').localA
        const localBAlias: typeof import('<root>/playground/composables/index').localBAlias
        const multiplier: typeof import('<root>/playground/composables/index').multiplier
        const myBazFunction: typeof import('<root>/playground/composables/nested/bar/baz').myBazFunction
        const myfunc1: typeof import('<root>/playground/composables/nested/bar/named').myfunc1
        const myfunc2: typeof import('<root>/playground/composables/nested/bar/named').myfunc2
        const named: typeof import('<root>/playground/composables/nested/bar/index').named
        const nested: typeof import('<root>/playground/composables/nested/index').default
        const pkg: typeof import('pkg/dts').pkg
        const reactive: typeof import('vue').reactive
        const ref: typeof import('vue').ref
        const subFoo: typeof import('<root>/playground/composables/nested/bar/sub/index').subFoo
        const toRefs: typeof import('vue').toRefs
        const useDoubled: typeof import('<root>/playground/composables/index').useDoubled
        const useEffect: typeof import('react').useEffect
        const useRef: typeof import('react').useRef
        const useState: typeof import('react').useState
        const vanillaA: typeof import('<root>/playground/composables/vanilla').vanillaA
        const vanillaAMJS: typeof import('<root>/playground/composables/vanilla').vanillaAMJS
        const vanillaB: typeof import('<root>/playground/composables/vanilla').vanillaB
        const vanillaBMJS: typeof import('<root>/playground/composables/vanilla').vanillaBMJS
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
