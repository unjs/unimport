import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'
import { traveseScopes } from '../src/detect-acorn'

describe('detect-acorn', () => {
  it('scopes', async () => {
    const ast = parse(`
      import { foo1, bar as foo2 } from 'bar'
      import * as foo3 from 'bar'
      import foo4 from 'bar2'

      function foo5() {
        const local1 = 1
        if (true) {
          const local2 = 2
        }

        foo1()
        foo2.bar.baz()
        console.log(foo3)

        const local4 = local1 + local2

        const bar2 = { foo4, ...foo5 }
        bar = [1, 2, 3, foo6, ...foo7]
        bar = { a: foo8 + \`\${foo9}\` }

        foo10?.bar.baz()

        // This should be marked as unmatched
        if (foo100) {
          // declare inside won't work
          let foo100 = 1
        }
      }

      const [foo6, foo7] = [1, 2]
      let { bar: foo8, nested: { z: foo9 }, foo10 } = { bar: 1, nested: { z: 2 } }
      var foo11 = 1, foo12 = 2

      const [foo13, ...foo14] = [1, 2]

      class foo15 {

      }
    `, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      locations: true,
    })

    const { scopes, unmatched } = traveseScopes(ast as any)

    expect(unmatched)
      .toMatchInlineSnapshot(`
        Set {
          "console",
          "local2",
          "foo100",
        }
      `)

    expect(scopes.map(i => ({
      declarations: [...i.declarations].sort(),
      references: [...i.references].sort(),
    })))
      .toMatchInlineSnapshot(`
        [
          {
            "declarations": [
              "foo1",
              "foo10",
              "foo11",
              "foo12",
              "foo13",
              "foo14",
              "foo15",
              "foo2",
              "foo3",
              "foo4",
              "foo5",
              "foo6",
              "foo7",
              "foo8",
              "foo9",
            ],
            "references": [
              "foo10",
              "foo8",
              "foo9",
            ],
          },
          {
            "declarations": [
              "bar2",
              "local1",
              "local4",
            ],
            "references": [
              "console",
              "foo1",
              "foo10",
              "foo100",
              "foo2",
              "foo3",
              "foo4",
              "foo5",
              "foo6",
              "foo7",
              "foo8",
              "foo9",
              "local1",
              "local2",
            ],
          },
          {
            "declarations": [
              "local2",
            ],
            "references": [],
          },
          {
            "declarations": [
              "foo100",
            ],
            "references": [],
          },
        ]
      `)
  })
})

describe('virtual imports', () => {
  const ctx = createUnimport({
    imports: [
      { from: 'foo', name: 'foo', as: 'bar' },
    ],
    parser: 'acorn',
    presets: ['vue'],
    virtualImports: ['#imports'],
  })

  it('inject', async () => {
    const fixture = `
  import { watch } from 'fs'
  import { ref, computed, watchEffect as effect,
    bar as BAR } from '#imports'

  const a = ref(1)
  const b = shallowRef(2) // auto import

  effect(() => {})

  watch('file')
    `.trim()

    expect((await ctx.injectImports(fixture)).code)
      .toMatchInlineSnapshot(`
        "import { shallowRef, ref, computed, watchEffect as effect } from 'vue';
        import { foo as BAR } from 'foo';
        import { watch } from 'fs'
          

          const a = ref(1)
          const b = shallowRef(2) // auto import

          effect(() => {})

          watch('file')"
      `)
  })

  it('virtual imports only', async () => {
    const fixture = `
import { ref } from '#imports'
const a = computed()
`.trim()
    expect((await ctx.injectImports(fixture, undefined, { autoImport: false })).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';

        const a = computed()"
      `)
  })

  it('non-exist', async () => {
    const fixture = `
import { notExist } from '#imports'
    `.trim()

    await expect(ctx.injectImports(fixture)).rejects.toMatchInlineSnapshot('[Error: [unimport] failed to find "notExist" imported from "#imports"]')
  })

  it('comment false-positive', async () => {
    const fixture = `
// import { } from '#imports';

const a = ref(1)
    `.trim()

    expect((await ctx.injectImports(fixture, undefined, { autoImport: false })).code)
      .toMatchInlineSnapshot(`
        "// import { } from '#imports';

        const a = ref(1)"
      `)
  })

  // https://github.com/unocss/unocss/issues/2938
  it('side-effects', async () => {
    const fixture = `
import 'uno.css'
import { ref } from '#imports';
export default ref(() => {})
        `.trim()

    expect((await ctx.injectImports(fixture, undefined, { autoImport: false })).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';
        import 'uno.css'

        export default ref(() => {})"
      `)
  })
})
