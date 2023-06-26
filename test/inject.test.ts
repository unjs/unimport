import { expect, describe, test } from 'vitest'
import { createUnimport } from '../src'

describe('inject import', () => {
  test('basic', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }]
    })
    expect((await injectImports('console.log(fooBar())')).code)
      .toMatchInlineSnapshot(`
        "import { fooBar } from 'test-id';
        console.log(fooBar())"
      `)
  })

  test('should not match export', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }]
    })
    expect((await injectImports('export { fooBar } from "test-id"')).code)
      .toMatchInlineSnapshot('"export { fooBar } from \\"test-id\\""')
  })

  test('metadata', async () => {
    const ctx = createUnimport({
      imports: [
        { name: 'import1', from: 'specifier1' },
        { name: 'import2', from: 'specifier2' },
        { name: 'import3', from: 'specifier3' },
        { name: 'import4', from: 'specifier4' },
        { name: 'foo', as: 'import5', from: 'specifier5' },
        { name: 'import10', from: 'specifier10' }
      ],
      collectMeta: true
    })
    await ctx.injectImports('console.log(import1())', 'foo')
    await ctx.injectImports('console.log(import1())', 'foo')
    await ctx.injectImports('console.log(import2())', 'bar')
    await ctx.injectImports('console.log(import1())', 'gar')

    expect(ctx.getMetadata()).toMatchInlineSnapshot(`
      {
        "injectionUsage": {
          "import1": {
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
          "import2": {
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
        },
      }
    `)
  })

  test('mergeExisting', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      mergeExisting: true
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

  test('injection at end', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true
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

  test('injection at end with comment', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true
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

  test('injection at end with mixed imports', async () => {
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
      injectAtEnd: true
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
})
