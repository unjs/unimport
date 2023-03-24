import { join, relative } from 'pathe'
import { describe, expect, test } from 'vitest'
import { scanDirExports, toImports } from '../src'

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
            "as": "PascalCased",
            "from": "PascalCased.ts",
            "name": "PascalCased",
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

  test('scanDirExports star', async () => {
    const dir = join(__dirname, '../playground/composables')
    const importsResult = (await scanDirExports(dir, {
      filePatterns: [
        'nested/bar/index.ts'
      ]
    }))
      .map((i) => {
        i.from = relative(dir, i.from)
        return i
      })

    expect(toImports(importsResult)).toMatchInlineSnapshot(`
      "import { bar, named } from 'nested/bar/index.ts';
      import { myBazFunction } from 'nested/bar/baz.ts';
      import { subFoo } from 'nested/bar/sub/index.ts';"
    `)
  })

  test('scanDirs should respect dirs order', async () => {
    const firstFolder = join(__dirname, '../playground/composables')
    const secondFolder = join(__dirname, '../playground/composables-override')
    const options = {
      filePatterns: [
        '*.{ts,js,mjs,cjs,mts,cts}',
        '*/index.{ts,js,mjs,cjs,mts,cts}'
      ]
    }

    const [result1, result2] = await Promise.all([
      scanDirExports([firstFolder, secondFolder], options),
      scanDirExports([secondFolder, firstFolder], options)
    ])

    expect(result1.at(-1)?.from).toBe(join(secondFolder, 'foo.ts'))
    expect(result2.at(0)?.from).toBe(join(secondFolder, 'foo.ts'))
  })
})
