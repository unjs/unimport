import { describe, expect, test } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { createUnimport } from '../src'

const result = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div>{{ foo }}</div>
    <div>{{ foo + 1 }}</div>
    <div v-if="foo"></div>
    <div v-if="foo === 1"></div>
    <div @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false
  }
})

describe('vue-template', () => {
  const ctx = createUnimport({
    imports: [
      { name: 'foo', from: 'foo', as: 'foo' }
    ],
    addons: {
      vueTemplate: true
    }
  })

  test('inject', async () => {
    expect(result.code).toMatchInlineSnapshot(`
      "import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode, Fragment as _Fragment } from \\"vue\\"

      export function render(_ctx, _cache) {
        return (_openBlock(), _createElementBlock(_Fragment, null, [
          _createElementVNode(\\"div\\", null, _toDisplayString(_ctx.foo), 1 /* TEXT */),
          _createElementVNode(\\"div\\", null, _toDisplayString(_ctx.foo + 1), 1 /* TEXT */),
          (_ctx.foo)
            ? (_openBlock(), _createElementBlock(\\"div\\", { key: 0 }))
            : _createCommentVNode(\\"v-if\\", true),
          (_ctx.foo === 1)
            ? (_openBlock(), _createElementBlock(\\"div\\", { key: 1 }))
            : _createCommentVNode(\\"v-if\\", true),
          _createElementVNode(\\"div\\", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          })
        ], 64 /* STABLE_FRAGMENT */))
      }"
    `)
    expect((await ctx.injectImports(result.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
      "import { foo as _unimport_foo } from 'foo';
      import { unref as _unimport_unref_ } from 'vue';import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode, Fragment as _Fragment } from \\"vue\\"

      export function render(_ctx, _cache) {
        return (_openBlock(), _createElementBlock(_Fragment, null, [
          _createElementVNode(\\"div\\", null, _toDisplayString(_unimport_unref_(_unimport_foo)), 1 /* TEXT */),
          _createElementVNode(\\"div\\", null, _toDisplayString(_unimport_unref_(_unimport_foo) + 1), 1 /* TEXT */),
          (_unimport_unref_(_unimport_foo))
            ? (_openBlock(), _createElementBlock(\\"div\\", { key: 0 }))
            : _createCommentVNode(\\"v-if\\", true),
          (_unimport_unref_(_unimport_foo) === 1)
            ? (_openBlock(), _createElementBlock(\\"div\\", { key: 1 }))
            : _createCommentVNode(\\"v-if\\", true),
          _createElementVNode(\\"div\\", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_unimport_unref_(_unimport_foo) && _unimport_unref_(_unimport_foo)(...args)))
          })
        ], 64 /* STABLE_FRAGMENT */))
      }"
    `)
  })

  test('dts', async () => {
    expect(await ctx.generateTypeDeclarations()).toMatchInlineSnapshot(`
      "export {}
      declare global {
        const foo: typeof import('foo')['foo']
      }
      // for vue template auto import
      import { UnwrapRef } from 'vue'
      declare module '@vue/runtime-core' {
        interface ComponentCustomProperties {
          readonly foo: UnwrapRef<typeof import('foo')['foo']>
        }
      }
      "
    `)
  })

  test('skip non-targets', async () => {
    const input = 'ctx.multiplier'
    expect((await ctx.injectImports(input, 'a.vue')).code.toString())
      .toEqual(input)
  })
})
