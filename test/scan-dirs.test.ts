import { join, relative } from 'pathe'
import { describe, expect, test } from 'vitest'
import { scanDirExports } from '../src'

describe('scan-dirs', () => {
  test('scanDirExports', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports(dir))
      .map(i => ({
        ...i,
        from: relative(dir, i.from)
      }))
      .sort((a, b) => a.as!.localeCompare(b.as!))
    )
      .toMatchInlineSnapshot(`
        [
          {
            "as": "bump",
            "from": "index.ts",
            "name": "bump",
          },
          {
            "as": "foo",
            "from": "foo.ts",
            "name": "default",
          },
          {
            "as": "localA",
            "from": "index.ts",
            "name": "localA",
          },
          {
            "as": "localBAlias",
            "from": "index.ts",
            "name": "localBAlias",
          },
          {
            "as": "multiplier",
            "from": "index.ts",
            "name": "multiplier",
          },
          {
            "as": "useDoubled",
            "from": "index.ts",
            "name": "useDoubled",
          },
        ]
      `)
  })

  test('scanDirExports nested', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports(dir, {
      filePatterns: [
        '*.{ts,js,mjs,cjs,mts,cts}',
        '*/index.{ts,js,mjs,cjs,mts,cts}'
      ]
    }))
      .map(i => relative(dir, i.from))
      .sort()
    )
      .toContain('nested/index.ts')
  })
})
