import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('export default class', () => {
  let dir: string
  let file: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'unimport-default-class-'))
    file = join(dir, 'MyClass.js')
    await writeFile(file, 'export default class MyClass {\n  hello() { return 1 }\n}\n', 'utf-8')
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('injects a default import instead of a named one', async () => {
    const unimport = createUnimport({})
    await unimport.scanImportsFromFile(file)
    const result = await unimport.injectImports('new MyClass()')

    expect(result.code).toContain('import MyClass from')
    expect(result.code).not.toMatch(/import\s*\{\s*MyClass\s*\}/)
  })
})
