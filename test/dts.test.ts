
import { expect, test } from 'vitest'
import { createUnimport } from '../src'

test('dts', async () => {
  const { generateTypeDeclarations, init } = createUnimport({
    imports: [
      { name: 'default', from: 'default', as: 'customDefault' },
      { name: 'foobar', from: 'foobar', as: 'foobar' }
    ],
    presets: [
      {
        from: 'vue',
        imports: ['ref', 'reactive', 'computed', 'toRefs']
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
        imports: ['$']
      }
    ],
    dirs: [
      './playground/composables/**'
    ],
    dirsScanOptions: {
      cwd: process.cwd()
    }
  })

  await init()

  expect(await generateTypeDeclarations())
    .toMatchInlineSnapshot(`
      "export {}
      declare global {
        const $: typeof import('jquery')['$']
        const THREE: typeof import('three')
        const bump: typeof import('/Users/antfu/i/unimport/playground/composables/index')['bump']
        const computed: typeof import('vue')['computed']
        const customDefault: typeof import('default')['default']
        const foo: typeof import('/Users/antfu/i/unimport/playground/composables/foo')['default']
        const foobar: typeof import('foobar')['foobar']
        const localA: typeof import('/Users/antfu/i/unimport/playground/composables/index')['localA']
        const localBAlias: typeof import('/Users/antfu/i/unimport/playground/composables/index')['localBAlias']
        const multiplier: typeof import('/Users/antfu/i/unimport/playground/composables/index')['multiplier']
        const nested: typeof import('/Users/antfu/i/unimport/playground/composables/nested/index')['default']
        const reactive: typeof import('vue')['reactive']
        const ref: typeof import('vue')['ref']
        const toRefs: typeof import('vue')['toRefs']
        const useDoubled: typeof import('/Users/antfu/i/unimport/playground/composables/index')['useDoubled']
        const useEffect: typeof import('react')['useEffect']
        const useRef: typeof import('react')['useRef']
        const useState: typeof import('react')['useState']
      }"
    `)
})
