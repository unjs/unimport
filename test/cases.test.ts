/// <reference types="vite/client" />

import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolve } from 'pathe'
import { createUnimport } from '../src/context'
import type { UnimportOptions } from '../src'

const UNMODIFIED_MARK = '@test-unmodified'

const cwd = fileURLToPath(new URL('.', import.meta.url))

const filters: string[] = [
  // put file name here to test specific case
]

const options: Record<string, Partial<UnimportOptions>> = {
  default: {},
  acorn: {
    parser: 'acorn',
  },
}

const excludes: Record<string, (file: string) => boolean> = {
  default: (file: string) => !!file.match(/acorn-/),
  acorn: (file: string) => !file.match(/\.js$/),
}

Object.entries(options).forEach(([name, options]) => {
  describe(`cases ${name}`, () => {
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
        { name: 'Mixin', from: './Mixin', as: 'Mixin' },
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
          ],
        },
        {
          from: 'lit',
          imports: ['LitElement'],
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
          imports: ['$'],
        },
      ],
      commentsDisable: [
        '@unimport-disable',
        '@imports-disable',
        '@custom-imports-disable',
      ],
      ...options,
    })

    const negatives = import.meta.glob('./cases/negative/*', { as: 'raw' })
    const positives = import.meta.glob('./cases/positive/*', { as: 'raw' })

    for (const [file, getCode] of Object.entries(positives)) {
      if (excludes?.[name]?.(file))
        continue
      if (filters.length && !filters.some(f => file.includes(f)))
        continue
      if (file.match(/\.output\./))
        continue

      it(basename(file), async () => {
        const code = await getCode()
        const pass1 = (await injectImports(code, file))?.code ?? code
        if (code.includes(UNMODIFIED_MARK)) {
          expect(pass1).toBe(code)
        }
        else {
          await expect(pass1).toMatchFileSnapshot(
            resolve(cwd, file, '../..', 'output', name, basename(file)),
          )
          expect(pass1).not.toEqual(code)
          const pass2 = (await injectImports(pass1, file))?.code ?? pass1
          expect(pass2).toBe(pass1)
        }
      })
    }

    for (const [file, getCode] of Object.entries(negatives)) {
      if (excludes?.[name]?.(file))
        continue
      if (filters.length && !filters.some(f => file.includes(f)))
        continue
      it(basename(file), async () => {
        const code = await getCode()
        const pass1 = (await injectImports(code, file))?.code ?? code
        expect(pass1).toBe(code)
      })
    }
  })
})
