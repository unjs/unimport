
import { expect, test } from 'vitest'
import { createUnimport } from '../src'

test('dts', async () => {
  const cwd = process.cwd().replace(/\\/g, '/')
  const { generateTypeDeclarations, init } = createUnimport({
    imports: [
      { name: 'default', from: 'default', as: 'customDefault' },
      { name: 'foobar', from: 'foobar', as: 'foobar' }
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
            type: true
          },
          {
            name: 'ComputedRef',
            type: true
          }
        ]
      },
      {
        from: 'three',
        imports: [['*', 'THREE']]
      },
      {
        from: 'react',
        imports: ['useState', 'useEffect', 'useRef']
      },
      {
        from: 'jquery',
        imports: [
          '$',
          {
            name: 'JQuery',
            type: true
          }
        ]
      }
    ],
    dirs: [
      './playground/composables/**'
    ],
    dirsScanOptions: {
      cwd
    }
  })

  await init()

  expect(
    (await generateTypeDeclarations()).replaceAll(cwd, '<root>')
  )
    .toMatchInlineSnapshot(`
      "export {}
      declare global {
        const $: typeof import('jquery')['$']
        const PascalCased: typeof import('<root>/playground/composables/PascalCased')['PascalCased']
        const THREE: typeof import('three')
        const bar: typeof import('<root>/playground/composables/nested/bar/index')['bar']
        const bump: typeof import('<root>/playground/composables/index')['bump']
        const computed: typeof import('vue')['computed']
        const customDefault: typeof import('default')['default']
        const foo: typeof import('<root>/playground/composables/foo')['default']
        const foobar: typeof import('foobar')['foobar']
        const localA: typeof import('<root>/playground/composables/index')['localA']
        const localBAlias: typeof import('<root>/playground/composables/index')['localBAlias']
        const multiplier: typeof import('<root>/playground/composables/index')['multiplier']
        const myBazFunction: typeof import('<root>/playground/composables/nested/bar/baz')['myBazFunction']
        const myfunc1: typeof import('<root>/playground/composables/nested/bar/named')['myfunc1']
        const myfunc2: typeof import('<root>/playground/composables/nested/bar/named')['myfunc2']
        const named: typeof import('<root>/playground/composables/nested/bar/index')['named']
        const nested: typeof import('<root>/playground/composables/nested/index')['default']
        const reactive: typeof import('vue')['reactive']
        const ref: typeof import('vue')['ref']
        const subFoo: typeof import('<root>/playground/composables/nested/bar/sub/index')['subFoo']
        const toRefs: typeof import('vue')['toRefs']
        const useDoubled: typeof import('<root>/playground/composables/index')['useDoubled']
        const useEffect: typeof import('react')['useEffect']
        const useRef: typeof import('react')['useRef']
        const useState: typeof import('react')['useState']
      }
      // for type re-export
      declare global {
        // @ts-ignore
        export type { Ref, ComputedRef } from 'vue'
        // @ts-ignore
        export type { JQuery } from 'jquery'
      }"
    `)
})
