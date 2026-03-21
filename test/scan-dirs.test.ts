import { join, relative } from 'pathe'
import { describe, expect, it } from 'vitest'
import { normalizeScanDirs, scanDirExports, stringifyImports } from '../src'
import { scanExports } from '../src/node/scan-dirs'

describe('scan-dirs', () => {
  it('scanDirExports', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports([dir]))
      .map(i => ({
        ...i,
        from: relative(dir, i.from),
      }))
      .sort((a, b) => a.as!.localeCompare(b.as!)),
    )
      .toMatchInlineSnapshot(`
        [
          {
            "as": "BAR",
            "from": "comma-separated.ts",
            "name": "BAR",
          },
          {
            "as": "bump",
            "from": "index.ts",
            "name": "bump",
          },
          {
            "as": "compA",
            "from": "generic-exports.ts",
            "name": "compA",
          },
          {
            "as": "compB",
            "from": "generic-exports.ts",
            "name": "compB",
          },
          {
            "as": "compC",
            "from": "generic-exports.ts",
            "name": "compC",
          },
          {
            "as": "compD",
            "from": "generic-exports.ts",
            "name": "compD",
          },
          {
            "as": "CustomEnum",
            "from": "index.ts",
            "name": "CustomEnum",
          },
          {
            "as": "CustomEnum",
            "declarationType": "enum",
            "from": "index.ts",
            "name": "CustomEnum",
            "type": true,
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
            "as": "FOO",
            "from": "comma-separated.ts",
            "name": "FOO",
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
            "as": "mergeObjects",
            "from": "generic-exports.ts",
            "name": "mergeObjects",
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
            "as": "PascalCased",
            "declarationType": "class",
            "from": "PascalCased.ts",
            "name": "PascalCased",
            "type": true,
          },
          {
            "as": "uninitBar",
            "from": "generic-exports.ts",
            "name": "uninitBar",
          },
          {
            "as": "uninitFoo",
            "from": "generic-exports.ts",
            "name": "uninitFoo",
          },
          {
            "as": "useDoubled",
            "from": "index.ts",
            "name": "useDoubled",
          },
          {
            "as": "useGenericStore",
            "from": "generic-exports.ts",
            "name": "useGenericStore",
          },
          {
            "as": "useResizable",
            "from": "generic-exports.ts",
            "name": "useResizable",
          },
          {
            "as": "useSleep",
            "from": "async-value.ts",
            "name": "useSleep",
          },
          {
            "as": "vanillaA",
            "from": "vanilla.js",
            "name": "vanillaA",
          },
          {
            "as": "vanillaAMJS",
            "from": "vanilla.mjs",
            "name": "vanillaAMJS",
          },
          {
            "as": "vanillaB",
            "from": "vanilla.js",
            "name": "vanillaB",
          },
          {
            "as": "vanillaBMJS",
            "from": "vanilla.mjs",
            "name": "vanillaBMJS",
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

  it('scanDirExports exclude glob', async () => {
    const dir = join(__dirname, '../playground/composables/nested')
    expect((await scanDirExports([dir, `!${join(dir, 'bar')}`]))
      .map(i => ({
        ...i,
        from: relative(dir, i.from),
      }))
      .sort((a, b) => a.as!.localeCompare(b.as!)),
    )
      .toMatchInlineSnapshot(`
        [
          {
            "as": "CustomType3",
            "from": "index.ts",
            "name": "CustomType3",
            "type": true,
          },
          {
            "as": "nested",
            "from": "index.ts",
            "name": "default",
          },
        ]
      `)
  })

  it('scanDirExports nested', async () => {
    const dir = join(__dirname, '../playground/composables')
    expect((await scanDirExports([dir], {
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
    const importsResult = (await scanDirExports([dir], {
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

    expect(stringifyImports(importsResult)).toMatchInlineSnapshot(`
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

  it('scanDirs specific dirs types disable/enable', async () => {
    const dir = join(__dirname, '../playground/composables/nested')
    const barDir = join(__dirname, '../playground/composables/nested/bar')

    const exports1 = await scanDirExports([dir, { glob: barDir, types: false }])
    expect(exports1.some(i => i.name === 'CustomType2')).toEqual(false)
    expect(exports1.some(i => i.name === 'CustomType3')).toEqual(true)

    const exports2 = await scanDirExports([dir, { glob: barDir, types: true }], { types: false })

    expect(exports2.some(i => i.name === 'CustomType2')).toEqual(true)
    expect(exports2.some(i => i.name === 'CustomType3')).toEqual(false)
  })

  it('scanDirs default file pattern', async () => {
    const dir = join(__dirname, '../playground/composables/nested')
    const exports = await scanDirExports([dir])
    expect(exports.some(i => i.name === 'CustomType3')).toEqual(true)

    const dirWithSingleAsterisk = join(__dirname, '../playground/composables/nested/*')
    const singleAsteriskExports = await scanDirExports([dirWithSingleAsterisk])
    expect(singleAsteriskExports.some(i => i.name === 'CustomType3')).toEqual(true)

    const dirWithDoubleAsterisk = join(__dirname, '../playground/composables/nested/**')
    const doubleAsteriskExports = await scanDirExports([dirWithDoubleAsterisk])
    expect(doubleAsteriskExports.some(i => i.name === 'CustomType3')).toEqual(true)
    expect(doubleAsteriskExports.some(i => i.name === 'CustomType2')).toEqual(true)
  })

  it('scanDirs original dirs glob', async () => {
    const dir = join(__dirname, '../playground/composables/nested/index.ts')
    const exports = await scanDirExports([dir])
    expect(exports.some(i => i.name === 'CustomType3')).toEqual(true)

    const dirWithSingleAsterisk = join(__dirname, '../playground/composables/nested/*/index.ts')
    const singleAsteriskExports = await scanDirExports([dirWithSingleAsterisk])
    expect(singleAsteriskExports.some(i => i.name === 'CustomType2')).toEqual(true)
  })

  it('should not register JS reserved words as exports from declaration expressions', async () => {
    // mlly's regex parser incorrectly captures `async` from arrow function
    // bodies (e.g. `export const x = () => foo(async () => {})`) as an export
    // name. unimport should filter these out.
    const filepath = join(__dirname, '../playground/composables/async-value.ts')
    const exports = await scanExports(filepath, false)
    const names = exports.map(i => i.name)
    expect(names).toContain('useSleep')
    expect(names).not.toContain('async')
  })

  it('should not leak generic type parameter identifiers as exports (#502)', async () => {
    // mlly's regex parser incorrectly captures identifiers from generic type
    // parameters (e.g. `Record<string, Ref>`) as export names because it
    // misinterprets commas inside angle brackets as declarator separators.
    const filepath = join(__dirname, '../playground/composables/generic-exports.ts')
    const exports = await scanExports(filepath, false)
    const names = exports.map(i => i.name)

    // Actual export names should be present
    expect(names).toContain('useGenericStore')
    expect(names).toContain('mergeObjects')

    // Type identifiers from generics must not leak
    expect(names).not.toContain('Ref')
    expect(names).not.toContain('B')
    expect(names).not.toContain('Record')
    expect(names).not.toContain('object')
  })

  it('should export uninitialised names in multi-declarator statements', async () => {
    // `export let foo, bar = 1` — both `foo` and `bar` should be exported.
    // See: CodeRabbit review on PR #513
    const filepath = join(__dirname, '../playground/composables/generic-exports.ts')
    const exports = await scanExports(filepath, false)
    const names = exports.map(i => i.name)

    expect(names).toContain('uninitFoo')
    expect(names).toContain('uninitBar')
  })

  it('should not confuse comparison operators with angle brackets', async () => {
    // `export const a = 1 < 2 ? ... , b = 42` — the `<` in the RHS must
    // not corrupt bracket depth and hide the comma separating `a` from `b`.
    // See: CodeRabbit review on PR #513
    const filepath = join(__dirname, '../playground/composables/generic-exports.ts')
    const exports = await scanExports(filepath, false)
    const names = exports.map(i => i.name)

    // Digit before `<` (1 < 2)
    expect(names).toContain('compA')
    expect(names).toContain('compB')
    // Identifier before `<` (_someNum < 100) — must not be confused with generic
    expect(names).toContain('compC')
    expect(names).toContain('compD')
  })

  it('should export useResizable but not its arrow function parameter (#502)', async () => {
    // Pin the original regression from issue #502: arrow function with
    // generic type params should export the binding name, not the params.
    const filepath = join(__dirname, '../playground/composables/generic-exports.ts')
    const exports = await scanExports(filepath, false)
    const names = exports.map(i => i.name)

    expect(names).toContain('useResizable')
    expect(names).not.toContain('options')
    expect(names).not.toContain('columns')
  })
})

it('normalizeScanDirs', () => {
  expect(normalizeScanDirs(['playground/composables/nested'], {
    cwd: '/',
  }))
    .toMatchInlineSnapshot(`
      [
        {
          "glob": "/playground/composables/nested",
          "types": true,
        },
        {
          "glob": "/playground/composables/nested/*.{mts,cts,ts,tsx,mjs,cjs,js,jsx}",
          "types": true,
        },
      ]
    `)
  expect(normalizeScanDirs(['playground/composables/nested/*'], {
    cwd: '/',
    types: false,
  }))
    .toMatchInlineSnapshot(`
      [
        {
          "glob": "/playground/composables/nested/*",
          "types": false,
        },
        {
          "glob": "/playground/composables/nested/*.{mts,cts,ts,tsx,mjs,cjs,js,jsx}",
          "types": false,
        },
      ]
    `)
  expect(normalizeScanDirs(['playground/composables/nested/**'], {
    cwd: '/',
  }))
    .toMatchInlineSnapshot(`
      [
        {
          "glob": "/playground/composables/nested/**",
          "types": true,
        },
        {
          "glob": "/playground/composables/nested/**/*.{mts,cts,ts,tsx,mjs,cjs,js,jsx}",
          "types": true,
        },
      ]
    `)
})
