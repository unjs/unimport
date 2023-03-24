/// <reference types="vite/client" />

import { basename } from 'path'
import { describe, it, expect } from 'vitest'
import { createUnimport } from '../src/context'

const UNMODIFIED_MARK = '@test-unmodified'

describe('fixtures', () => {
  const { injectImports } = createUnimport({
    imports: [
      { name: 'default', from: 'default', as: 'customDefault' },
      { name: 'foobar', from: 'foobar', as: 'foobar' },
      { name: 'fooConst', from: 'foo', as: 'fooConst' },
      { name: 'test', from: 'vitest', as: 'test' },
      { name: 'Foo', from: 'foobar', as: 'Foo' },
      { name: 'Bar', from: 'foobar', as: 'Bar' },
      { name: 'it', from: 'it', as: 'it' },
      { name: 'fit', from: 'fit', as: 'fit' },
      { name: 'Mixin', from: './Mixin', as: 'Mixin' }
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
        imports: ['$']
      }
    ],
    commentsDisable: [
      '@unimport-disable',
      '@imports-disable',
      '@custom-imports-disable'
    ]
  })

  const files = import.meta.glob('./fixtures/*', {
    as: 'raw',
    eager: true
  })

  for (const [file, code] of Object.entries(files)) {
    it(basename(file), async () => {
      const pass1 = (await injectImports(code, file))?.code ?? code
      if (code.includes(UNMODIFIED_MARK)) {
        expect(pass1).toBe(code)
      } else {
        expect(pass1).toMatchSnapshot()
        expect(pass1).not.toEqual(code)
        const pass2 = (await injectImports(pass1, file))?.code ?? pass1
        expect(pass2).toBe(pass1)
      }
    })
  }
})
