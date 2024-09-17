import { describe, expect, it } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { createUnimport } from '../src'

const defaultDirective = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-awesome-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

const singleMixedDirectives = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-named-mixed-directive v-mixed-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

const multipleDirectives = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-awesome-directive v-custom-directive @click="foo"></div>
    <div v-awesome-directive v-custom-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

const allDirectives = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-awesome-directive v-custom-directive v-mixed-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

function replaceRoot(code: string) {
  return code.replaceAll(process.cwd().replace(/\\/g, '/'), '<root>')
}

describe('vue-directives', () => {
  describe('single default directive', () => {
    const ctx = createUnimport({
      presets: [{
        from: '/directives/awesome-directive.ts',
        imports: [{
          name: 'default',
          meta: {
            vueDirective: true,
          },
        }],
      }],
      addons: {
        vueDirectives: true,
      },
    })
    it('inject', async () => {
      expect(replaceRoot(defaultDirective.code)).toMatchInlineSnapshot(`
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
      expect(replaceRoot((await ctx.injectImports(defaultDirective.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import _directive_awesome_directive from '/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive]
          ])
        }"
      `)
    })

    it('dts', async () => {
      expect(replaceRoot(await ctx.generateTypeDeclarations())).toMatchInlineSnapshot(`
        "export {}
        declare global {
          const default: typeof import('/directives/awesome-directive')['default']
        }
        // for vue directives auto import
        declare module 'vue' {
          interface ComponentCustomProperties {
            vAwesomeDirective: typeof import('/directives/awesome-directive')['default']
          }
          interface GlobalDirectives {
            vAwesomeDirective: typeof import('/directives/awesome-directive')['default']
          }
        }"
      `)
    })
  })

  describe('single named directive', () => {
    const ctx = createUnimport({
      presets: [{
        from: '/directives/awesome-directive.ts',
        imports: [{
          name: 'AwesomeDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }],
      addons: {
        vueDirectives: true,
      },
    })
    it('inject', async () => {
      expect(replaceRoot(defaultDirective.code)).toMatchInlineSnapshot(`
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
      expect(replaceRoot((await ctx.injectImports(defaultDirective.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { AwesomeDirective as _directive_awesome_directive } from '/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive]
          ])
        }"
      `)
    })
  })

  describe('single mixed directives', () => {
    const ctx = createUnimport({
      presets: [{
        from: '/directives/mixed-directive.ts',
        imports: [{
          name: 'NamedMixedDirective',
          meta: {
            vueDirective: true,
          },
        }, {
          name: 'default',
          meta: {
            vueDirective: true,
          },
        }],
      }],
      addons: {
        vueDirectives: true,
      },
    })

    it('inject', async () => {
      expect(replaceRoot(singleMixedDirectives.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_named_mixed_directive = _resolveDirective("named-mixed-directive")
          const _directive_mixed_directive = _resolveDirective("mixed-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_named_mixed_directive],
            [_directive_mixed_directive]
          ])
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(singleMixedDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import _directive_mixed_directive from '/directives/mixed-directive.ts';
        import { NamedMixedDirective as _directive_named_mixed_directive } from '/directives/mixed-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_named_mixed_directive],
            [_directive_mixed_directive]
          ])
        }"
      `)
    })
  })

  describe('multiple mixed directives', () => {
    const ctx = createUnimport({
      presets: [{
        from: '/directives/custom-directive.ts',
        imports: [{
          name: 'CustomDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }, {
        from: '/directives/awesome-directive.ts',
        imports: [{
          name: 'default',
          meta: {
            vueDirective: true,
          },
        }],
      }],
      addons: {
        vueDirectives: true,
      },
    })

    it('inject', async () => {
      expect(replaceRoot(multipleDirectives.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_awesome_directive = _resolveDirective("awesome-directive")
          const _directive_custom_directive = _resolveDirective("custom-directive")

          return (_openBlock(), _createElementBlock(_Fragment, null, [
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ]),
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ])
          ], 64 /* STABLE_FRAGMENT */))
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(multipleDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { CustomDirective as _directive_custom_directive } from '/directives/custom-directive.ts';
        import _directive_awesome_directive from '/directives/awesome-directive.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return (_openBlock(), _createElementBlock(_Fragment, null, [
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ]),
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ])
          ], 64 /* STABLE_FRAGMENT */))
        }"
      `)
    })
  })

  describe('multiple directives', () => {
    const ctx = createUnimport({
      presets: [{
        from: '/multiple-directives/index.ts',
        imports: [{
          name: 'CustomDirective',
          meta: {
            vueDirective: true,
          },
        }, {
          name: 'AwesomeDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }],
      addons: {
        vueDirectives: true,
      },
    })

    it('inject', async () => {
      expect(replaceRoot(multipleDirectives.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_awesome_directive = _resolveDirective("awesome-directive")
          const _directive_custom_directive = _resolveDirective("custom-directive")

          return (_openBlock(), _createElementBlock(_Fragment, null, [
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ]),
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ])
          ], 64 /* STABLE_FRAGMENT */))
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(multipleDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { CustomDirective as _directive_custom_directive, AwesomeDirective as _directive_awesome_directive } from '/multiple-directives/index.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return (_openBlock(), _createElementBlock(_Fragment, null, [
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ]),
            _withDirectives(_createElementVNode("div", {
              onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */), [
              [_directive_awesome_directive],
              [_directive_custom_directive]
            ])
          ], 64 /* STABLE_FRAGMENT */))
        }"
      `)
    })
  })
  describe('multiple directives with dirs', async () => {
    const ctx = createUnimport({
      dirsScanOptions: {
        cwd: `${process.cwd().replace(/\\/g, '/')}/playground`,
      },
      dirs: ['./directives/**'],
      addons: {
        vueDirectives: {
          isDirective(normalizeImportFrom) {
            return normalizeImportFrom.includes('/directives/')
          },
        },
      },
    })

    await ctx.init()

    it('inject', async () => {
      expect(replaceRoot(allDirectives.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_awesome_directive = _resolveDirective("awesome-directive")
          const _directive_custom_directive = _resolveDirective("custom-directive")
          const _directive_mixed_directive = _resolveDirective("mixed-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive],
            [_directive_custom_directive],
            [_directive_mixed_directive]
          ])
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(allDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import _directive_mixed_directive from '<root>/playground/directives/mixed-directive.ts';
        import _directive_custom_directive from '<root>/playground/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/playground/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive],
            [_directive_custom_directive],
            [_directive_mixed_directive]
          ])
        }"
      `)
    })
  })
})
