import { describe, expect, test } from 'vitest'
import { createUnimport } from '../src'

describe('virtual imports', () => {
  const ctx = createUnimport({
    imports: [
      { from: 'foo', name: 'foo', as: 'bar' }
    ],
    presets: ['vue'],
    virtualImports: ['#imports']
  })

  test('inject', async () => {
    const fixture = `
  import { watch } from 'fs'
  import { ref, computed, watchEffect as effect,
    bar as BAR } from '#imports'

  const a = ref(1)
  const b = shallowRef(2) // auto import

  effect(() => {})

  watch('file')
    `.trim()

    expect(ctx.parseVirtualImports(fixture).map(i => i.namedImports))
      .toMatchInlineSnapshot(`
        [
          {
            "bar": "BAR",
            "computed": "computed",
            "ref": "ref",
            "watchEffect": "effect",
          },
        ]
      `)
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

  test('virtual imports only', async () => {
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

  test('non-exist', async () => {
    const fixture = `
import { notExist } from '#imports'
    `.trim()

    await expect(ctx.injectImports(fixture)).rejects
      .toMatchInlineSnapshot('[Error: [unimport] failed to find "notExist" imported from "#imports"]')
  })

  test('comment false-positive', async () => {
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
  test('side-effects', async () => {
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
