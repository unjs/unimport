import process from 'node:process'
import { findStaticImports } from 'mlly'
import { describe, expect, it } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { resolvePresets } from '../playground/configure-directives'
import { createUnimport } from '../src'

const defaultDirective = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  // DONT'T REMOVE v-missing directive (for coverage)
  source: `
    <div v-missing v-awesome-directive v-named-directive v-focus-directive v-ripple-directive @click="foo"></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

const singleNamedDirectives = compileTemplate({
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
    <div
      v-awesome-directive
      v-custom-directive
      v-mixed-directive
      v-focus-directive
      v-ripple-directive
      @click="foo"
    ></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

const onlySingleDirective = compileTemplate({
  id: 'template.vue',
  filename: 'template.vue',
  source: `
    <div v-awesome-directive></div>
  `,
  compilerOptions: {
    hoistStatic: false,
  },
})

function replaceRoot(code: string) {
  return code.replaceAll(process.cwd().replace(/\\/g, '/'), '<root>')
}

describe('vue-directives', () => {
  describe('single default directive', async () => {
    const ctx = createUnimport({
      presets: resolvePresets([{
        from: 'directives/awesome-directive.ts',
        imports: [{
          name: 'default',
          meta: {
            vueDirective: true,
          },
        }],
      }, {
        from: 'directives/named-directive.ts',
        imports: [{
          name: 'NamedDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }, {
        from: 'directives/ripple-directive.ts',
        imports: [{
          name: 'vRippleDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }, {
        from: 'directives/v-focus-directive.ts',
        imports: [{
          name: 'default',
          as: 'FocusDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }]),
      addons: {
        vueDirectives: true,
      },
    })

    await ctx.init()

    it('inject', async () => {
      expect(replaceRoot(defaultDirective.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_missing = _resolveDirective("missing")
          const _directive_awesome_directive = _resolveDirective("awesome-directive")
          const _directive_named_directive = _resolveDirective("named-directive")
          const _directive_focus_directive = _resolveDirective("focus-directive")
          const _directive_ripple_directive = _resolveDirective("ripple-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_missing],
            [_directive_awesome_directive],
            [_directive_named_directive],
            [_directive_focus_directive],
            [_directive_ripple_directive]
          ])
        }"
      `)
      const transformed = replaceRoot((await ctx.injectImports(defaultDirective.code, 'a.vue')).code.toString())
      const imports = findStaticImports(transformed)
      expect(imports.some(i => i.imports.includes('_resolveDirective')), '_resolveDirective import should be present').toBeTruthy()
      expect(transformed).toMatchInlineSnapshot(`
        "import { vRippleDirective as _directive_ripple_directive } from '<root>/directives/ripple-directive.ts';
        import _directive_focus_directive from '<root>/directives/v-focus-directive.ts';
        import { NamedDirective as _directive_named_directive } from '<root>/directives/named-directive.ts';
        import _directive_awesome_directive from '<root>/directives/awesome-directive.ts';import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_missing = _resolveDirective("missing")
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_missing],
            [_directive_awesome_directive],
            [_directive_named_directive],
            [_directive_focus_directive],
            [_directive_ripple_directive]
          ])
        }"
      `)
    })

    it('dts', async () => {
      expect(replaceRoot(await ctx.generateTypeDeclarations())).toMatchInlineSnapshot(`
        "export {}
        declare global {
          const FocusDirective: typeof import('<root>/directives/v-focus-directive')['default']
          const NamedDirective: typeof import('<root>/directives/named-directive')['NamedDirective']
          const default: typeof import('<root>/directives/awesome-directive')['default']
          const vRippleDirective: typeof import('<root>/directives/ripple-directive')['vRippleDirective']
        }
        // for vue directives auto import
        declare module 'vue' {
          interface ComponentCustomProperties {
            vAwesomeDirective: typeof import('<root>/directives/awesome-directive')['default']
            vFocusDirective: typeof import('<root>/directives/v-focus-directive')['default']
            vNamedDirective: typeof import('<root>/directives/named-directive')['NamedDirective']
            vRippleDirective: typeof import('<root>/directives/ripple-directive')['vRippleDirective']
          }
          interface GlobalDirectives {
            vAwesomeDirective: typeof import('<root>/directives/awesome-directive')['default']
            vFocusDirective: typeof import('<root>/directives/v-focus-directive')['default']
            vNamedDirective: typeof import('<root>/directives/named-directive')['NamedDirective']
            vRippleDirective: typeof import('<root>/directives/ripple-directive')['vRippleDirective']
          }
        }"
      `)
    })
  })

  describe('single named directive', () => {
    const ctx = createUnimport({
      presets: resolvePresets([{
        from: 'directives/awesome-directive.ts',
        imports: [{
          name: 'AwesomeDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }]),
      addons: {
        vueDirectives: true,
      },
    })
    it('inject', async () => {
      expect(replaceRoot(singleNamedDirectives.code)).toMatchInlineSnapshot(`
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
      expect(replaceRoot((await ctx.injectImports(singleNamedDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { AwesomeDirective as _directive_awesome_directive } from '<root>/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
      presets: resolvePresets([{
        from: 'directives/mixed-directive.ts',
        imports: [{
          name: 'NamedMixedDirective',
          meta: {
            vueDirective: true,
          },
        }, {
          name: 'default',
          as: 'MixedDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }]),
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
        "import _directive_mixed_directive from '<root>/directives/mixed-directive.ts';
        import { NamedMixedDirective as _directive_named_mixed_directive } from '<root>/directives/mixed-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
      presets: resolvePresets([{
        from: 'directives/custom-directive.ts',
        imports: [{
          name: 'CustomDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }, {
        from: 'directives/awesome-directive.ts',
        imports: [{
          name: 'default',
          as: 'AwesomeDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }]),
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
        "import { CustomDirective as _directive_custom_directive } from '<root>/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/directives/awesome-directive.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
      presets: resolvePresets([{
        from: 'multiple-directives/index.ts',
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
      }]),
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
        "import { CustomDirective as _directive_custom_directive, AwesomeDirective as _directive_awesome_directive } from '<root>/multiple-directives/index.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
        // DON'T REMOVE: for coverage
        addons: [{ declaration: dts => dts }],
        // DON'T REMOVE: for coverage
        vueTemplate: true,
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
          const _directive_focus_directive = _resolveDirective("focus-directive")
          const _directive_ripple_directive = _resolveDirective("ripple-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive],
            [_directive_custom_directive],
            [_directive_mixed_directive],
            [_directive_focus_directive],
            [_directive_ripple_directive]
          ])
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(allDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { vRippleDirective as _directive_ripple_directive } from '<root>/playground/directives/ripple-directive.ts';
        import _directive_focus_directive from '<root>/playground/directives/v-focus-directive.ts';
        import _directive_mixed_directive from '<root>/playground/directives/mixed-directive.ts';
        import _directive_custom_directive from '<root>/playground/directives/custom-directive.ts';
        import _directive_awesome_directive from '<root>/playground/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", {
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
          }, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive],
            [_directive_custom_directive],
            [_directive_mixed_directive],
            [_directive_focus_directive],
            [_directive_ripple_directive]
          ])
        }"
      `)
    })

    // DON'T REMOVE: same as previous test (for coverage)
    describe('manual multiple directives with dirs', async () => {
      const addons = await import('../src/addons').then(({ vueTemplateAddon, vueDirectivesAddon }) => ([
        vueTemplateAddon(),
        vueDirectivesAddon({ isDirective: importFrom => importFrom.includes('/directives/') }),
      ]))
      const ctx = createUnimport({
        dirsScanOptions: {
          cwd: `${process.cwd().replace(/\\/g, '/')}/playground`,
        },
        dirs: ['./directives/**'],
        addons,
      })

      await ctx.init()

      it('inject', async () => {
        expect(replaceRoot(allDirectives.code)).toMatchInlineSnapshot(`
          "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

          export function render(_ctx, _cache) {
            const _directive_awesome_directive = _resolveDirective("awesome-directive")
            const _directive_custom_directive = _resolveDirective("custom-directive")
            const _directive_mixed_directive = _resolveDirective("mixed-directive")
            const _directive_focus_directive = _resolveDirective("focus-directive")
            const _directive_ripple_directive = _resolveDirective("ripple-directive")

            return _withDirectives((_openBlock(), _createElementBlock("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */)), [
              [_directive_awesome_directive],
              [_directive_custom_directive],
              [_directive_mixed_directive],
              [_directive_focus_directive],
              [_directive_ripple_directive]
            ])
          }"
        `)
        expect(replaceRoot((await ctx.injectImports(allDirectives.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
          "import { vRippleDirective as _directive_ripple_directive } from '<root>/playground/directives/ripple-directive.ts';
          import _directive_focus_directive from '<root>/playground/directives/v-focus-directive.ts';
          import _directive_mixed_directive from '<root>/playground/directives/mixed-directive.ts';
          import _directive_custom_directive from '<root>/playground/directives/custom-directive.ts';
          import _directive_awesome_directive from '<root>/playground/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

          export function render(_ctx, _cache) {
            return _withDirectives((_openBlock(), _createElementBlock("div", {
              onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.foo && _ctx.foo(...args)))
            }, null, 512 /* NEED_PATCH */)), [
              [_directive_awesome_directive],
              [_directive_custom_directive],
              [_directive_mixed_directive],
              [_directive_focus_directive],
              [_directive_ripple_directive]
            ])
          }"
        `)
      })
    })
  })

  describe('directives with dtsDisabled and meta.vueDirective from preset', () => {
    const ctx = createUnimport({
      presets: resolvePresets([{
        from: 'directives/mixed-directive.ts',
        dtsDisabled: true,
        meta: {
          vueDirective: true,
        },
        imports: [{
          name: 'NamedMixedDirective',
        }, {
          name: 'default',
          as: 'MixedDirective',
        }],
      }]),
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
        "import _directive_mixed_directive from '<root>/directives/mixed-directive.ts';
        import { NamedMixedDirective as _directive_named_mixed_directive } from '<root>/directives/mixed-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

    it('dts', async () => {
      expect(replaceRoot(await ctx.generateTypeDeclarations())).toMatchInlineSnapshot(`
        "export {}
        declare global {

        }"
      `)
    })
  })

  describe('only single directive', async () => {
    const ctx = createUnimport({
      presets: resolvePresets([{
        from: 'directives/awesome-directive.ts',
        imports: [{
          name: 'AwesomeDirective',
          meta: {
            vueDirective: true,
          },
        }],
      }]),
      addons: {
        vueDirectives: true,
      },
    })

    await ctx.init()

    it('inject', async () => {
      expect(replaceRoot(onlySingleDirective.code)).toMatchInlineSnapshot(`
        "import { resolveDirective as _resolveDirective, withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          const _directive_awesome_directive = _resolveDirective("awesome-directive")

          return _withDirectives((_openBlock(), _createElementBlock("div", null, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive]
          ])
        }"
      `)
      expect(replaceRoot((await ctx.injectImports(onlySingleDirective.code, 'a.vue')).code.toString())).toMatchInlineSnapshot(`
        "import { AwesomeDirective as _directive_awesome_directive } from '<root>/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

        export function render(_ctx, _cache) {
          return _withDirectives((_openBlock(), _createElementBlock("div", null, null, 512 /* NEED_PATCH */)), [
            [_directive_awesome_directive]
          ])
        }"
      `)
    })

    it('dts', async () => {
      expect(replaceRoot(await ctx.generateTypeDeclarations())).toMatchInlineSnapshot(`
        "export {}
        declare global {
          const AwesomeDirective: typeof import('<root>/directives/awesome-directive')['AwesomeDirective']
        }
        // for vue directives auto import
        declare module 'vue' {
          interface ComponentCustomProperties {
            vAwesomeDirective: typeof import('<root>/directives/awesome-directive')['AwesomeDirective']
          }
          interface GlobalDirectives {
            vAwesomeDirective: typeof import('<root>/directives/awesome-directive')['AwesomeDirective']
          }
        }"
      `)
    })
  })

  describe('directives from scan with meta.vueDirective set to true', async () => {
    const cwd = `${process.cwd().replace(/\\/g, '/')}/playground`
    const directives = `${cwd}/directives/`
    const ctx = createUnimport({
      dirsScanOptions: { cwd },
      dirs: ['./directives/**'],
      addons: {
        // DON'T REMOVE: for coverage
        addons: [{ declaration: dts => dts }],
        // DON'T REMOVE: for coverage
        vueTemplate: true,
        vueDirectives: {
          isDirective(normalizeImportFrom) {
            return normalizeImportFrom.includes('/directives/')
          },
        },
      },
    })

    await ctx.init()

    it('meta.vueDirective set to true', async () => {
      await ctx.injectImports(allDirectives.code, 'a.vue')
      const imports = await ctx.getImports()
        .then(imports => imports.filter(i => i.from.startsWith(directives)).map((i) => {
          i.from = replaceRoot(i.from)
          return i
        }))
      imports.map(i => expect(i.meta?.vueDirective).toBeTruthy())
      expect(imports).toMatchInlineSnapshot(`
        [
          {
            "as": "awesomeDirective",
            "from": "<root>/playground/directives/awesome-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "default",
          },
          {
            "as": "AwesomeDirective",
            "from": "<root>/playground/directives/awesome-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "AwesomeDirective",
          },
          {
            "as": "customDirective",
            "from": "<root>/playground/directives/custom-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "default",
          },
          {
            "as": "CustomDirective",
            "from": "<root>/playground/directives/custom-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "CustomDirective",
          },
          {
            "as": "mixedDirective",
            "from": "<root>/playground/directives/mixed-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "default",
          },
          {
            "as": "NamedMixedDirective",
            "from": "<root>/playground/directives/mixed-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "NamedMixedDirective",
          },
          {
            "as": "NamedDirective",
            "from": "<root>/playground/directives/named-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "NamedDirective",
          },
          {
            "as": "vRippleDirective",
            "from": "<root>/playground/directives/ripple-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "vRippleDirective",
          },
          {
            "as": "vFocusDirective",
            "from": "<root>/playground/directives/v-focus-directive.ts",
            "meta": {
              "vueDirective": true,
            },
            "name": "default",
          },
        ]
      `)
    })
  })
})
