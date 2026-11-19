import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('inject import', () => {
  it('basic', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot(`
        "import { fooBar } from 'test-id';
        console.log(fooBar())"
      `)
  })

  it('detects identifiers followed by comparison and operator characters', async () => {
    const { injectImports } = createUnimport({
      imports: [
        { name: 'platform', from: 'runtime' },
        { name: 'isNative', from: 'runtime' },
        { name: 'count', from: 'runtime' },
        { name: 'total', from: 'runtime' },
        { name: 'flags', from: 'runtime' },
      ],
    })
    expect((await injectImports(`
if (platform === 'ios' && isNative !== false) {
  const modulo = count % 2
  const quotient = total / 2
  const xor = flags ^ 1
}
if (platform == 'android' || isNative != true) {
  const looseModulo = count % 3
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { platform, isNative, count, total, flags } from 'runtime';
        if (platform === 'ios' && isNative !== false) {
          const modulo = count % 2
          const quotient = total / 2
          const xor = flags ^ 1
        }
        if (platform == 'android' || isNative != true) {
          const looseModulo = count % 3
        }"
      `)
  })

  it('should not match export', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })
    expect((await injectImports('export { fooBar } from "test-id"')).code)
      .toMatchInlineSnapshot(`"export { fooBar } from "test-id""`)
  })

  it('injects a top-level reference when a nested for-of variable shadows the same name', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
const state = ref(new Set())
function doWork(items) {
  for (const ref of items) {
    console.log(ref.name)
  }
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';
        const state = ref(new Set())
        function doWork(items) {
          for (const ref of items) {
            console.log(ref.name)
          }
        }"
      `)
  })

  it('injects a top-level reference when a nested for-in variable shadows the same name', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
const state = ref(new Set())
function doWork(items) {
  for (const ref in items) {
    console.log(ref)
  }
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';
        const state = ref(new Set())
        function doWork(items) {
          for (const ref in items) {
            console.log(ref)
          }
        }"
      `)
  })

  it('injects a top-level reference when a nested for-await-of variable shadows the same name', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
const state = ref(new Set())
async function doWork(items) {
  for await (const ref of items) {
    console.log(ref.name)
  }
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';
        const state = ref(new Set())
        async function doWork(items) {
          for await (const ref of items) {
            console.log(ref.name)
          }
        }"
      `)
  })

  it('does not inject a loop-local for-of variable without an outer reference', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
function doWork(items) {
  for (const ref of items) {
    console.log(ref.name)
  }
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "function doWork(items) {
          for (const ref of items) {
            console.log(ref.name)
          }
        }"
      `)
  })

  it('does not inject a braceless loop-local for-of variable without an outer reference', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
function doWork(items) {
  for (const ref of items)
    console.log(ref.name)
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "function doWork(items) {
          for (const ref of items)
            console.log(ref.name)
        }"
      `)
  })

  it('does not inject a function-scoped var loop variable used after the loop', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
    })

    expect((await injectImports(`
function doWork(items) {
  for (var ref of items) {
    console.log(ref.name)
  }
  console.log(ref)
}
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "function doWork(items) {
          for (var ref of items) {
            console.log(ref.name)
          }
          console.log(ref)
        }"
      `)
  })

  it('metadata', async () => {
    const ctx = createUnimport({
      imports: [
        { name: 'import1', from: 'specifier1' },
        { name: 'import2', from: 'specifier2' },
        { name: 'import3', from: 'specifier3' },
        { name: 'import4', from: 'specifier4' },
        { name: 'foo', as: 'import5', from: 'specifier5' },
        { name: 'toString', from: 'specifier6' },
        { name: 'import10', from: 'specifier10' },
      ],
      collectMeta: true,
    })
    await ctx.injectImports('console.log(import1())', 'foo')
    await ctx.injectImports('console.log(import1())', 'foo')
    await ctx.injectImports('console.log(import2())', 'bar')
    await ctx.injectImports('console.log(import1())', 'gar')
    await ctx.injectImports('console.log(toString())')

    expect(ctx.getMetadata()).toMatchInlineSnapshot(`
      {
        "injectionsUsageMap": Map {
          "import1" => {
            "count": 3,
            "import": {
              "as": "import1",
              "from": "specifier1",
              "name": "import1",
            },
            "moduleIds": [
              "foo",
              "gar",
            ],
          },
          "import2" => {
            "count": 1,
            "import": {
              "as": "import2",
              "from": "specifier2",
              "name": "import2",
            },
            "moduleIds": [
              "bar",
            ],
          },
          "toString" => {
            "count": 1,
            "import": {
              "as": "toString",
              "from": "specifier6",
              "name": "toString",
            },
            "moduleIds": [],
          },
        },
      }
    `)
  })

  it('mergeExisting', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      mergeExisting: true,
    })
    expect((await injectImports(`
import { foo } from 'test-id'
console.log(fooBar())
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { fooBar, foo } from 'test-id'
        console.log(fooBar())"
      `)
  })

  it('injection at end', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true,
    })
    expect((await injectImports(`
import { foo } from 'foo'
console.log(fooBar())
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { foo } from 'foo'

        import { fooBar } from 'test-id';
        console.log(fooBar())"
      `)
  })

  it('injection at end with comment', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true,
    })

    expect((await injectImports(`
/**
* import { foo } from './foo'
*/

// import { foo1 } from './foo'
import { foo } from 'foo'
console.log(fooBar())
    `.trim())).code)
      .toMatchInlineSnapshot(`
      "/**
      * import { foo } from './foo'
      */

      // import { foo1 } from './foo'
      import { foo } from 'foo'

      import { fooBar } from 'test-id';
      console.log(fooBar())"
      `)
  })

  it('injection at end with regex', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true,
    })

    expect((await injectImports(`
const regex = /\//
const regex1 = /a[/]bcd/
fooBar()
    `.trim())).code)
      .toMatchInlineSnapshot(`
      "import { fooBar } from 'test-id';
      const regex = /\//
      const regex1 = /a[/]bcd/
      fooBar()"
      `)
  })

  it('injection at end with mixed imports', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true,
    })
    expect((await injectImports(`
import { foo } from 'foo'
console.log(nonAutoImport())
import { bar } from 'bar'
console.log(fooBar())
import { baz } from 'baz'
    `.trim())).code)
      .toMatchInlineSnapshot(`
        "import { foo } from 'foo'
        console.log(nonAutoImport())
        import { bar } from 'bar'

        import { fooBar } from 'test-id';
        console.log(fooBar())
        import { baz } from 'baz'"
      `)
  })

  it('deep ternary inject', async () => {
    const { injectImports } = createUnimport({
      imports: [
        { name: 'A', from: 'test-id' },
        { name: 'B', from: 'test-id' },
        { name: 'C', from: 'test-id' },
      ],
    })
    expect((await injectImports('const result = true ? false ? A : B : C')).code)
      .toMatchInlineSnapshot(`
        "import { A, B, C } from 'test-id';
        const result = true ? false ? A : B : C"
      `)
  })

  it('runs addon transforms without import candidates', async () => {
    const { injectImports } = createUnimport({
      addons: [{
        transform(s) {
          s.append('\ntransformed()')
          return s
        },
      }],
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })

    expect((await injectImports('plainCode()')).code)
      .toBe('plainCode()\ntransformed()')
  })

  it('runs injection hooks without import candidates', async () => {
    const { injectImports } = createUnimport({
      addons: [{
        injectImportsStringified(injection) {
          return injection || 'import "side-effect"'
        },
      }],
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })

    expect((await injectImports('plainCode()')).code)
      .toBe('import "side-effect"\nplainCode()')
  })

  it('logs debug comments without import candidates', async () => {
    const logs: string[] = []
    const { injectImports } = createUnimport({
      debugLog: message => logs.push(message),
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })

    await injectImports('// @unimport-debug\nplainCode()', 'example.ts')

    expect(logs).toEqual(['[unimport] 0 imports detected in "example.ts"'])
  })

  it('does not inject imports for classes with extends clauses', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'SystemError', from: 'test-id' }],
    })
    const code = `export class SystemError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, SystemError.prototype)
  }
}`

    expect((await injectImports(code)).code).toBe(code)
  })

  it.each([
    ['generator', 'function* useFoo() {}\nuseFoo()'],
    ['generator with spaces', 'function * useFoo() {}\nuseFoo()'],
    ['async generator', 'export async function* useFoo() {}\nuseFoo()'],
    ['generic', 'function useFoo<T>(value: T) {}\nuseFoo(1)'],
    ['generic with constraint', 'function useFoo<T extends Record<string, unknown>>(value: T) {}\nuseFoo({})'],
    ['generic generator', 'function* useFoo<T>() {}\nuseFoo()'],
    ['decimal literals followed by', 'const n = 1.\nfunction useFoo() {}\nuseFoo()'],
    ['decimal literals with separators followed by', 'const n = 1_000.\nfunction useFoo() {}\nuseFoo()'],
    ['comments ending with a period followed by', '// see docs.\nfunction useFoo() {}\nuseFoo()'],
  ])('does not inject imports for %s function declarations', async (_, code) => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'useFoo', from: 'test-id' }],
    })

    expect((await injectImports(code)).code).toBe(code)
  })

  it.each([
    ['identifiers starting with `function`', 'functionuseFoo()\nuseFoo()'],
    ['anonymous generators', 'export default function* () { useFoo() }'],
    ['a `function` property followed by a statement', 'const x = api.function\nuseFoo.value'],
    ['prose in JSX text', 'const el = <p>This function useFoo is nice</p>\nuseFoo()'],
    ['a `function` property multiplied by a call', 'const x = api.function * useFoo()'],
    ['a `function` property followed by a comparison', 'const x = api.function\nuseFoo < 3'],
    ['a `function` property of a decimal literal', 'const x = 1..function * useFoo()'],
    ['a `function` property of a fractional literal', 'const x = 1.5.function * useFoo()'],
    ['a `function` property of a hex literal', 'const x = 0x1.function * useFoo()'],
    ['a `function` property of an integer with a space', 'const x = 1 .function * useFoo()'],
    ['a `function` property of an identifier ending in a digit', 'const x = a1.function * useFoo()'],
    ['a `function` property of a non-ASCII identifier ending in a digit', 'const x = π1.function * useFoo()'],
    ['a `function` property of an identifier with a joiner before a digit', 'const x = a\u200D1.function * useFoo()'],
    ['identifiers ending in `$function`', 'const x = $function * useFoo()'],
    ['non-ASCII identifiers ending in `function`', 'const x = \u03C0function * useFoo()'],
  ])('does not treat %s as declarations', async (_, code) => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'useFoo', from: 'test-id' }],
    })

    expect((await injectImports(code)).code)
      .toBe(`import { useFoo } from 'test-id';\n${code}`)
  })
})
