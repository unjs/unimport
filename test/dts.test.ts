/* eslint-disable no-useless-escape */
import { expect, test } from 'vitest'
import { createUnimport } from '../src'

test('dts', () => {
  const { generateTypeDeclarations } = createUnimport({
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

  expect(generateTypeDeclarations())
    .toMatchInlineSnapshot(`
      "export {}
      declare global {
        const \$: typeof import('jquery')['\$']
        const THREE: typeof import('three')
        const computed: typeof import('vue')['computed']
        const customDefault: typeof import('default')['default']
        const foobar: typeof import('foobar')['foobar']
        const reactive: typeof import('vue')['reactive']
        const ref: typeof import('vue')['ref']
        const toRefs: typeof import('vue')['toRefs']
        const useEffect: typeof import('react')['useEffect']
        const useRef: typeof import('react')['useRef']
        const useState: typeof import('react')['useState']
      }"
    `)
})
