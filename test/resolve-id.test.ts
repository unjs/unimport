import { resolve } from 'pathe'
import { describe, expect, test } from 'vitest'
import { createUnimport, resolveIdAbsolute } from '../src'

describe('resolve-id', () => {
  const input = `
let a = ref(0)
let b = computed(() => a.value)
const path = resolvePath()
  `

  test('inject', async () => {
    const calls: (string| undefined)[][] = []
    const ctx = createUnimport({
      presets: [
        'vue',
        'vue-router'
      ],
      async resolveId (id, parentId) {
        await Promise.resolve()
        calls.push([id, parentId])
        return id + '?from=' + parentId
      }
    })

    expect((await ctx.injectImports(input, 'a.vue')).code.toString())
      .toMatchInlineSnapshot(`
        "import { ref, computed } from 'vue?from=a.vue';

        let a = ref(0)
        let b = computed(() => a.value)
        const path = resolvePath()
          "
      `)

    expect(calls).toMatchInlineSnapshot(`
      [
        [
          "vue",
          "a.vue",
        ],
        [
          "vue",
          "a.vue",
        ],
      ]
    `)
  })

  test('resolveAbsolute', async () => {
    const cwd = process.cwd()
    const path = resolve(cwd, 'a.vue')
    const ctx = createUnimport({
      presets: [
        'vue',
        {
          from: 'mlly',
          imports: ['resolvePath']
        }
      ],
      resolveId: resolveIdAbsolute
    })

    const transformed = (await ctx.injectImports(input, path)).code.toString()
    expect(transformed).toContain('node_modules/vue')
    expect(transformed).toContain('node_modules/mlly')
  })

  test('exclude self', async () => {
    const calls: (string| undefined)[][] = []
    const ctx = createUnimport({
      presets: [{
        from: 'a.vue',
        imports: ['foo']
      }]
    })

    expect((await ctx.injectImports('console.log(foo)', 'a.vue')).code.toString())
      .toMatchInlineSnapshot('"console.log(foo)"')

    expect((await ctx.injectImports('console.log(foo)', 'b.vue')).code.toString())
      .toMatchInlineSnapshot(`
        "import { foo } from 'a.vue';
        console.log(foo)"
      `)

    expect(calls).toMatchInlineSnapshot('[]')
  })
})
