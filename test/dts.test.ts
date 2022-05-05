/* eslint-disable no-useless-escape */
import { expect, test } from 'vitest'
import { createUnimport } from '../src'

test('dts', () => {
  const { generateTypeDecarations } = createUnimport({
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
    ]
  })

  expect(generateTypeDecarations())
    .toMatchInlineSnapshot(`
      "export {}
      declare global {
        const customDefault: typeof import('default')['default']
        const foobar: typeof import('foobar')['foobar']
        const ref: typeof import('vue')['ref']
        const reactive: typeof import('vue')['reactive']
        const computed: typeof import('vue')['computed']
        const toRefs: typeof import('vue')['toRefs']
        const THREE: typeof import('three')
        const useState: typeof import('react')['useState']
        const useEffect: typeof import('react')['useEffect']
        const useRef: typeof import('react')['useRef']
        const \$: typeof import('jquery')['\$']
      }"
    `)
})
