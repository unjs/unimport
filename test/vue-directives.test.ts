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
    <div v-named-mixed-directive v-default-mixed-directive @click="foo"></div>
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
      addons: {
        vueDirectives: {
          from: './src/directives/awesome-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-awesome-directive',
          },
        },
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
        "import _directive_awesome_directive from '<root>/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

        }
        // for vue directives auto import
        declare module 'vue' {
          interface ComponentCustomProperties {
            vAwesomeDirective: typeof import('<root>/src/directives/awesome-directive.ts')['default']
          }
          interface GlobalDirectives {
            vAwesomeDirective: typeof import('<root>/src/directives/awesome-directive.ts')['default']
          }
        }"
      `)
    })
  })

  describe('single named directive', () => {
    const ctx = createUnimport({
      addons: {
        vueDirectives: [{
          from: './src/directives/awesome-directive.ts',
          directives: {
            name: 'AwesomeDirective',
            directive: 'v-awesome-directive',
          },
        }],
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
        "import { AwesomeDirective as _directive_awesome_directive } from '<root>/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
      addons: {
        vueDirectives: [{
          from: './src/directives/mixed-directives.ts',
          directives: [{
            directive: 'v-named-mixed-directive',
            name: 'NamedMixedDirective',
            // as: 'NamedMixedDirective',
          }, {
            directive: 'v-default-mixed-directive',
            name: 'default',
          }],
        }],
      },
    })

    it('inject', async () => {
      expect(replaceRoot(singleMixedDirectives.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_named_mixed_directive = _resolveDirective("named-mixed-directive")
          const _directive_default_mixed_directive = _resolveDirective("default-mixed-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_named_mixed_directive],
            [_directive_default_mixed_directive]
          ])
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(singleMixedDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import _directive_default_mixed_directive from '<root>/src/directives/mixed-directives.ts';
        import { NamedMixedDirective as _directive_named_mixed_directive } from '<root>/src/directives/mixed-directives.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_named_mixed_directive],
            [_directive_default_mixed_directive]
          ])
        }"
      `)
    })
  })

  describe('multiple mixed directives', () => {
    const ctx = createUnimport({
      addons: {
        vueDirectives: [{
          from: './src/directives/custom-directive.ts',
          directives: {
            name: 'CustomDirective',
            directive: 'v-custom-directive',
          },
        }, {
          from: './src/directives/awesome-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-awesome-directive',
          },
        }],
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
        "import { CustomDirective as _directive_custom_directive } from '<root>/src/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/src/directives/awesome-directive.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
      addons: {
        vueDirectives: [{
          from: './src/directives/index.ts',
          directives: [{
            name: 'CustomDirective',
            directive: 'v-custom-directive',
          }, {
            name: 'AwesomeDirective',
            directive: 'v-awesome-directive',
          }],
        }],
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
        "import { CustomDirective as _directive_custom_directive, AwesomeDirective as _directive_awesome_directive } from '<root>/src/directives/index.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

  describe('preset and sub-presets with single vue directives', () => {
    const ctx = createUnimport({
      presets: [{
        // for string preset on addons (coverage)
        from: 'vue',
        imports: [],
      }, {
        from: 'preset',
        imports: [{
          // for string preset on addons (coverage)
          from: 'pinia',
          imports: [],
        }, {
          from: 'subpreset',
          imports: [],
          vueDirectives: {
            from: './src/directives/custom-directive.ts',
            directives: {
              name: 'default',
              directive: 'v-custom-directive',
            },
          },
        }],
        vueDirectives: {
          from: './src/directives/awesome-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-awesome-directive',
          },
        },
      }],
      addons: {
        // for addons in addons test (coverage)
        addons: [{
          name: 'dummy-addon',
          declaration: dts => dts,
        }],
        vueDirectives: {
          from: './src/directives/mixed-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-mixed-directive',
          },
        },
      },
    })
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
        "import _directive_mixed_directive from '<root>/src/directives/mixed-directive.ts';
        import _directive_custom_directive from '<root>/src/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

  describe('preset and sub-presets with array vue directives', () => {
    const ctx = createUnimport({
      presets: [{
        from: 'preset',
        imports: [{
          from: 'subpreset',
          imports: [],
          vueDirectives: [{
            from: './src/directives/custom-directive.ts',
            directives: {
              name: 'default',
              directive: 'v-custom-directive',
            },
          }],
        }],
        vueDirectives: [{
          from: './src/directives/awesome-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-awesome-directive',
          },
        }],
      }],
      addons: {
        vueDirectives: [{
          from: './src/directives/mixed-directive.ts',
          directives: {
            name: 'default',
            directive: 'v-mixed-directive',
          },
        }],
      },
    })
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
        "import _directive_mixed_directive from '<root>/src/directives/mixed-directive.ts';
        import _directive_custom_directive from '<root>/src/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
