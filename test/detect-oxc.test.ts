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
})
