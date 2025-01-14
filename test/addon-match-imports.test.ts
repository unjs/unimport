import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'
import { resolverAddon } from './share'

describe('addon match imports', () => {
  const ctx = createUnimport({
    presets: ['vue'],
    addons: [
      resolverAddon(),
    ],
  })

  it('inject', async () => {
    const code = `
import otherModule from 'otherModule'

const count = ref(0)
const component1 = ElInput
const component2 = ElSelect
const test = notDefined
console.log(otherModule)
`.trim()

    expect((await ctx.injectImports(code)).code)
      .toMatchInlineSnapshot(`
        "import { ref } from 'vue';
        import { ElInput, ElSelect } from 'element-plus/es';
        import 'element-plus/es/components/input/style/index';
        import 'element-plus/es/components/select/style/index';
        import otherModule from 'otherModule'

        const count = ref(0)
        const component1 = ElInput
        const component2 = ElSelect
        const test = notDefined
        console.log(otherModule)"
      `)
  })
})
