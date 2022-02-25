import { resolve } from 'path'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { describe, it, expect } from 'vitest'
import { createUnimport } from '../src/context'

const UNMODIFIED_MARK = '@test-unmodified'

describe('fixtures', async () => {
  const { injectImports } = createUnimport({
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

  const root = resolve(__dirname, 'fixtures')
  const files = await fg('*', {
    cwd: root,
    onlyFiles: true
  })

  for (const file of files) {
    it(file, async () => {
      const code = await fs.readFile(resolve(root, file), 'utf-8')
      const pass1 = (await injectImports(code))?.code ?? code
      if (code.includes(UNMODIFIED_MARK)) {
        expect(pass1).toBe(code)
      } else {
        expect(pass1).toMatchSnapshot()
        expect(pass1).not.toBe(code)
        const pass2 = (await injectImports(pass1))?.code ?? pass1
        expect(pass2).toBe(pass1)
      }
    })
  }
})
