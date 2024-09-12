import { describe, expect, it } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { createUnimport } from '../src'

const result = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-awesome-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

describe('vue-directives', () => {
  const ctx = createUnimport({
    addons: {
      vueDirectives: [{
        from: '/src/directives.ts',
        directives: [{
          name: 'v-awesome-directive',
          as: 'AwesomeDirective',
        }],
      }],
    },
  })

  it('inject', async () => {
    expect(result.code).toMatchInlineSnapshot(`
      "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

      export function render(_ctx, _cache) {
        const _directive_awesome_directive = _resolveDirective("awesome-directive")

        return _withDirectives((_openBlock(), _createElementBlock("div", {
          onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
        }, null, 512 /* NEED_PATCH */)), [
          [_directive_awesome_directive]
        ])
      }"
    `)
    expect((await ctx.injectImports(result.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
      "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

      export function render(_ctx, _cache) {
                                                                                   

        return _withDirectives((_openBlock(), _createElementBlock("div", {
          onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
        }, null, 512 /* NEED_PATCH */)), [
          [_directive_awesome_directive]
        ])
      }
      import { AwesomeDirective as _directive_awesome_directive } from '/src/directives.ts'"
    `)
  })
})
