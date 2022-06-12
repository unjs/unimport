import { describe, expect, test } from 'vitest'
import { createUnimport } from '../src'

describe('resolve-id', () => {
  const input = `
let a = ref(0)
let b = computed(() => a.value)
const router = useRouter()
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
        import { useRouter } from 'vue-router?from=a.vue';

        let a = ref(0)
        let b = computed(() => a.value)
        const router = useRouter()
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
        [
          "vue-router",
          "a.vue",
        ],
      ]
    `)
  })
})
