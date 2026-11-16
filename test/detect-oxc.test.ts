import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('detect-oxc', () => {
  const ctx = createUnimport({
    parser: 'oxc',
    imports: [
      { name: 'defineEventHandler', from: 'h3' },
      { name: 'ref', from: 'vue' },
    ],
  })

  it('should inject imports for modules with TypeScript-only syntax', async () => {
    const code = `const value: number = 1\nexport default defineEventHandler(() => ({ a: value }) as { a: number })`

    const result = await ctx.injectImports(code, '/x/handler.ts')

    expect(result.s.hasChanged()).toBe(true)
    expect(result.code).toMatchInlineSnapshot(`
      "import { defineEventHandler } from 'h3';
      const value: number = 1
      export default defineEventHandler(() => ({ a: value }) as { a: number })"
    `)
  })

  it('should strip a query suffix from the module id', async () => {
    const code = `const value: number = 1\nexport default defineEventHandler(() => value)`

    const result = await ctx.injectImports(code, '/x/handler.ts?macro=true')

    expect(result.s.hasChanged()).toBe(true)
  })

  it('should not inject imports for locally shadowed names', async () => {
    const code = `export function f(ref: unknown) { return ref }\nexport default defineEventHandler(() => 1)`

    const result = await ctx.injectImports(code, '/x/handler.ts')

    expect(result.code).toMatchInlineSnapshot(`
      "import { defineEventHandler } from 'h3';
      export function f(ref: unknown) { return ref }
      export default defineEventHandler(() => 1)"
    `)
  })

  it('should not inject imports when a name only appears inside strings', async () => {
    const code = `const label = 'ref'\nconst count = "ref"\nconsole.log(\`ref\`)`

    const result = await ctx.injectImports(code, '/x/string.ts')

    expect(result.imports).toEqual([])
    expect(result.code).toBe(code)
  })

  it('should not inject imports when a name only appears inside a comment', async () => {
    const code = `// ref and computed are mentioned here\n/* ref */\nconst value = 1`

    const result = await ctx.injectImports(code, '/x/comment.ts')

    expect(result.imports).toEqual([])
    expect(result.code).toBe(code)
  })

  it('should not inject a loop-local shadow while still injecting the outer reference', async () => {
    const code = `const state = ref(0)\nfunction walk(items) {\n  for (const ref of items) {\n    console.log(ref)\n  }\n}`

    const result = await ctx.injectImports(code, '/x/shadow.ts')

    expect(result.code).toMatchInlineSnapshot(`
      "import { ref } from 'vue';
      const state = ref(0)
      function walk(items) {
        for (const ref of items) {
          console.log(ref)
        }
      }"
    `)
  })

  it('should inject imports for unicode identifier names', async () => {
    const unicode = createUnimport({
      parser: 'oxc',
      imports: [{ name: 'café', from: 'test-id' }],
    })

    const result = await unicode.injectImports('console.log(café)', '/x/café.ts')

    expect(result.code).toMatchInlineSnapshot(`
      "import { café } from 'test-id';
      console.log(café)"
    `)
  })

  it('should inject imports for escaped identifiers', async () => {
    const escaped = createUnimport({
      parser: 'oxc',
      imports: [{ name: 'ref', from: 'vue' }],
    })

    for (const code of [
      'console.log(\\u0072ef(0))',
      'console.log(\\u{72}ef(0))',
      'console.log(r\\u0065f(0))',
    ]) {
      const result = await escaped.injectImports(code, '/x/escaped.js')
      expect(result.code).toBe(`import { ref } from 'vue';\n${code}`)
    }
  })

  it('injects before existing imports when injectAtEnd is set with the oxc parser', async () => {
    const injectAtEnd = createUnimport({
      parser: 'oxc',
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true,
    })

    const result = await injectAtEnd.injectImports('import { foo } from \'foo\'\nconsole.log(fooBar())')

    expect(result.code).toMatchInlineSnapshot(`
      "import { fooBar } from 'test-id';
      import { foo } from 'foo'
      console.log(fooBar())"
    `)
  })
})
