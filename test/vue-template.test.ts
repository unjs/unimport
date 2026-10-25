import { describe, expect, it } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { createUnimport, vueTemplateAddon } from '../src'
import { functionWrapAddon } from './share'

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
    hoistStatic: false,
  },
})

describe('vue-template', () => {
  const ctx = createUnimport({
    imports: [
      { name: 'foo', from: 'foo', as: 'foo' },
    ],
    addons: {
      vueTemplate: true,
    },
  })

  it('inject', async () => {
    expect(result.code).toMatchInlineSnapshot(`
      "import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode, Fragment as _Fragment } from "vue"

      export function render(_ctx, _cache) {
        return (_openBlock(), _createElementBlock(_Fragment, null, [
          _createElementVNode("div", null, _toDisplayString(_ctx.foo), 1 /* TEXT */),
          _createElementVNode("div", null, _toDisplayString(_ctx.foo + 1), 1 /* TEXT */),
          (_ctx.foo)
            ? (_openBlock(), _createElementBlock("div", { key: 0 }))
            : _createCommentVNode("v-if", true),
          (_ctx.foo === 1)
            ? (_openBlock(), _createElementBlock("div", { key: 1 }))
            : _createCommentVNode("v-if", true),
          _createElementVNode("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          })
        ], 64 /* STABLE_FRAGMENT */))
      }"
    `)
    expect((await ctx.injectImports(result.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
      "import { foo as __unimport_foo } from 'foo';
      import { unref as __unimport_unref_ } from 'vue';import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode, Fragment as _Fragment } from "vue"

      export function render(_ctx, _cache) {
        return (_openBlock(), _createElementBlock(_Fragment, null, [
          _createElementVNode("div", null, _toDisplayString(("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo))), 1 /* TEXT */),
          _createElementVNode("div", null, _toDisplayString(("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) + 1), 1 /* TEXT */),
          (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)))
            ? (_openBlock(), _createElementBlock("div", { key: 0 }))
            : _createCommentVNode("v-if", true),
          (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) === 1)
            ? (_openBlock(), _createElementBlock("div", { key: 1 }))
            : _createCommentVNode("v-if", true),
          _createElementVNode("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) && ("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo))(...args)))
          })
        ], 64 /* STABLE_FRAGMENT */))
      }"
    `)
  })

  it('dts', async () => {
    expect(await ctx.generateTypeDeclarations()).toMatchInlineSnapshot(`
      "export {}
      declare global {
        const foo: typeof import('foo').foo
      }
      // for vue template auto import
      import { UnwrapRef } from 'vue'
      declare module 'vue' {
        interface ComponentCustomProperties {
          readonly foo: UnwrapRef<typeof import('foo')['foo']>
        }
      }"
    `)
  })

  it('skip non-targets', async () => {
    const input = 'ctx.multiplier'
    expect((await ctx.injectImports(input, 'a.vue')).code.toString())
      .toEqual(input)
  })

  it('without addon hooks', async () => {
    const ctx = createUnimport({
      imports: [
        { name: 'foo', from: 'vue', as: 'foo' },
      ],
      addons: [
        vueTemplateAddon(),
        functionWrapAddon(),
      ],
    })

    expect((await ctx.injectImports(result.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
      "import { foo as _$___unimport_foo, unref as _$___unimport_unref_ } from 'vue';
      import { __helper } from "helper"
      const __unimport_foo = __helper(_$___unimport_foo)
      const __unimport_unref_ = __helper(_$___unimport_unref_)
      import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode, Fragment as _Fragment } from "vue"

      export function render(_ctx, _cache) {
        return (_openBlock(), _createElementBlock(_Fragment, null, [
          _createElementVNode("div", null, _toDisplayString(("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo))), 1 /* TEXT */),
          _createElementVNode("div", null, _toDisplayString(("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) + 1), 1 /* TEXT */),
          (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)))
            ? (_openBlock(), _createElementBlock("div", { key: 0 }))
            : _createCommentVNode("v-if", true),
          (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) === 1)
            ? (_openBlock(), _createElementBlock("div", { key: 1 }))
            : _createCommentVNode("v-if", true),
          _createElementVNode("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo)) && ("foo" in _ctx ? _ctx.foo : __unimport_unref_(__unimport_foo))(...args)))
          })
        ], 64 /* STABLE_FRAGMENT */))
      }"
    `)
  })
})

describe('vue-template import lookups', () => {
  const render = (names: string[]): string => `export function render(_ctx) { return [${names.map(name => `_ctx.${name}`).join(',')}]; }`

  it('keeps the first alias and injects repeated references once', async () => {
    const ctx = createUnimport({
      autoImport: false,
      addons: [vueTemplateAddon(), {
        extendImports: () => [
          { name: 'first', as: 'value', from: 'first-lib' },
          { name: 'second', as: 'value', from: 'second-lib' },
        ],
      }],
    })
    const { code } = await ctx.injectImports(render(Array.from<string>({ length: 40 }).fill('value')), 'a.vue')
    expect(code).toContain('import { first as __unimport_value } from \'first-lib\'')
    expect(code).not.toContain('second-lib')
    expect(code.match(/first as __unimport_value/g)).toHaveLength(1)
  })

  it('preserves alias getter reads', async () => {
    let reads = 0
    const ctx = createUnimport({
      autoImport: false,
      addons: [vueTemplateAddon(), {
        extendImports: () => [{ name: 'value', from: 'value-lib', get as() {
          reads++
          return 'value'
        } }],
      }],
    })
    await ctx.getImports()
    reads = 0
    await ctx.injectImports(render(Array.from<string>({ length: 40 }).fill('value')), 'a.vue')
    expect(reads).toBe(41)
  })

  it('does not read an alias after the first match', async () => {
    let throwOnRead = false
    const ctx = createUnimport({
      autoImport: false,
      addons: [vueTemplateAddon(), {
        extendImports: () => [
          { name: 'first', as: 'value', from: 'first-lib' },
          { name: 'second', from: 'second-lib', get as() {
            if (throwOnRead)
              throw new Error('unused alias')
            return 'other'
          } },
        ],
      }],
    })
    await ctx.getImports()
    throwOnRead = true
    const { code } = await ctx.injectImports(render(Array.from<string>({ length: 40 }).fill('value')), 'a.vue')
    expect(code).toContain('from \'first-lib\'')
  })

  it.each(['from', Symbol('metadata')])('observes aliases changed by a spread getter: %s', async (key) => {
    const later = { name: 'later', as: 'old', from: 'later-lib' }
    const first = { name: 'first', as: 'first', from: 'first-lib' }
    Object.defineProperty(first, key, {
      enumerable: true,
      get() {
        later.as = 'renamed'
        return 'first-lib'
      },
    })
    const ctx = createUnimport({
      autoImport: false,
      addons: [vueTemplateAddon(), { extendImports: () => [first, later] }],
    })
    const names = [...Array.from<string>({ length: 6 }).fill('missing'), 'first', ...Array.from<string>({ length: 39 }).fill('renamed')]
    const { code } = await ctx.injectImports(render(names), 'a.vue')
    expect(code).toContain('import { later as __unimport_renamed } from \'later-lib\'')
  })

  it('uses updated dynamic imports on the next transform', async () => {
    const ctx = createUnimport({ autoImport: false, addons: [vueTemplateAddon()] })
    const input = render(Array.from<string>({ length: 40 }).fill('value'))
    await ctx.modifyDynamicImports(() => [{ name: 'first', as: 'value', from: 'first-lib' }])
    expect((await ctx.injectImports(input, 'a.vue')).code).toContain('from \'first-lib\'')
    await ctx.modifyDynamicImports(() => [{ name: 'second', as: 'value', from: 'second-lib' }])
    const { code } = await ctx.injectImports(input, 'a.vue')
    expect(code).toContain('from \'second-lib\'')
    expect(code).not.toContain('first-lib')
  })

  it('runs injection hooks after indexed lookups', async () => {
    const ctx = createUnimport({
      autoImport: false,
      imports: [{ name: 'value', from: 'original-lib' }],
      addons: [vueTemplateAddon(), {
        injectImportsResolved(imports) {
          return imports.map(item => ({ ...item, from: 'changed-lib' }))
        },
        injectImportsStringified(code) {
          return `// injection hook\n${code}`
        },
      }],
    })
    const { code } = await ctx.injectImports(render(Array.from<string>({ length: 40 }).fill('value')), 'a.vue')
    expect(code).toContain('changed-lib')
    expect(code).toContain('// injection hook')
    expect(code).not.toContain('original-lib')
  })
})
