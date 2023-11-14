import { join, relative } from 'pathe'
import { describe, expect, it } from 'vitest'
import { scanDirExports, toImports } from '../src'

describe('scan-dirs', () => {
  it('scanDirExports', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports(dir))
      .map(i => ({
        ...i,
        from: relative(dir, i.from),
      }))
      .sort((a, b) => a.as!.localeCompare(b.as!)),
    )
      .toMatchInlineSnapshot(`
        [
          {
            "as": "bump",
            "from": "index.ts",
            "name": "bump",
          },
          {
            "as": "CustomInterface1",
            "from": "index.ts",
            "name": "CustomInterface1",
            "type": true,
          },
          {
            "as": "CustomType1",
            "from": "index.ts",
            "name": "CustomType1",
            "type": true,
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
          {
            "as": "vanillaA",
            "from": "vanilla.js",
            "name": "vanillaA",
          },
          {
            "as": "vanillaB",
            "from": "vanilla.js",
            "name": "vanillaB",
          },
          {
            "as": "VanillaInterface",
            "from": "vanilla.d.ts",
            "name": "VanillaInterface",
            "type": true,
          },
          {
            "as": "VanillaInterfaceAlias",
            "from": "vanilla.d.ts",
            "name": "VanillaInterfaceAlias",
            "type": true,
          },
          {
            "as": "vanillaTypeOnlyFunction",
            "from": "vanilla.d.ts",
            "name": "vanillaTypeOnlyFunction",
            "type": true,
          },
        ]
      `)
  })

  it('scanDirExports nested', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports(dir, {
      filePatterns: [
        '*.{ts,js,mjs,cjs,mts,cts}',
        '*/index.{ts,js,mjs,cjs,mts,cts}',
      ],
    }))
      .map(i => relative(dir, i.from))
      .sort(),
    )
      .toContain('nested/index.ts')
  })

  it('scanDirExports star', async () => {
    const dir = join(__dirname, '../playground/composables')
    const importsResult = (await scanDirExports(dir, {
      filePatterns: [
        'nested/bar/index.ts',
      ],
    }))
      .map((i) => {
        i.from = relative(dir, i.from)
        return i
      })

    expect(importsResult).toMatchInlineSnapshot(`
      [
        {
          "as": "bar",
          "from": "nested/bar/index.ts",
          "name": "bar",
        },
        {
          "as": "myBazFunction",
          "from": "nested/bar/baz.ts",
          "name": "myBazFunction",
        },
        {
          "as": "named",
          "from": "nested/bar/index.ts",
          "name": "named",
        },
        {
          "as": "subFoo",
          "from": "nested/bar/sub/index.ts",
          "name": "subFoo",
        },
        {
          "as": "CustomType2",
          "from": "nested/bar/sub/index.ts",
          "name": "CustomType2",
          "type": true,
        },
      ]
    `)

    expect(toImports(importsResult)).toMatchInlineSnapshot(`
      "import { bar, named } from 'nested/bar/index.ts';
      import { myBazFunction } from 'nested/bar/baz.ts';
      import { subFoo } from 'nested/bar/sub/index.ts';"
    `)
  })

  it('scanDirs should respect dirs order', async () => {
    const firstFolder = join(__dirname, '../playground/composables')
    const secondFolder = join(__dirname, '../playground/composables-override')
    const options = {
      filePatterns: [
        '*.{ts,js,mjs,cjs,mts,cts}',
        '*/index.{ts,js,mjs,cjs,mts,cts}',
      ],
    }

    const [result1, result2] = await Promise.all([
      scanDirExports([firstFolder, secondFolder], options),
      scanDirExports([secondFolder, firstFolder], options),
    ])

    expect(result1.at(-1)?.from).toBe(join(secondFolder, 'foo.ts'))
    expect(result2.at(0)?.from).toBe(join(secondFolder, 'foo.ts'))
  })
})
