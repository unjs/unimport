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

describe('vue-directives', () => {
  describe('default directive', () => {
    const ctx = createUnimport({
      addons: {
        vueDirectives: [{
          from: '/src/directives/awesome-directive.ts',
          directives: { name: 'v-awesome-directive' },
        }],
      },
    })
    it('inject', async () => {
      expect(defaultDirective.code).toMatchInlineSnapshot(`
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
      expect((await ctx.injectImports(defaultDirective.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
        "import _directive_awesome_directive from '/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

  describe('single named directive', () => {
    const ctx = createUnimport({
      addons: {
        vueDirectives: [{
          from: '/src/directives/awesome-directive.ts',
          directives: { name: 'v-awesome-directive', as: 'AwesomeDirective' },
        }],
      },
    })
    it('inject', async () => {
      expect(defaultDirective.code).toMatchInlineSnapshot(`
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
      expect((await ctx.injectImports(defaultDirective.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
        "import { AwesomeDirective as _directive_awesome_directive } from '/src/directives/awesome-directive.ts';import { withDirectives as _withDirectives, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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

  describe('mixed directives', () => {
    const ctx = createUnimport({
      addons: {
        vueDirectives: [{
          from: '/src/directives/custom-directive.ts',
          directives: {
            name: 'v-custom-directive',
            as: 'CustomDirective',
          },
        }, {
          from: '/src/directives/awesome-directive.ts',
          directives: {
            name: 'v-awesome-directive',
          },
        }],
      },
    })

    it('inject', async () => {
      expect(multipleDirectives.code).toMatchInlineSnapshot(`
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
      expect((await ctx.injectImports(multipleDirectives.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
        "import { CustomDirective as _directive_custom_directive } from '/src/directives/custom-directive.ts';
        import _directive_awesome_directive from '/src/directives/awesome-directive.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
          from: '/src/directives/index.ts',
          directives: [{
            name: 'v-custom-directive',
            as: 'CustomDirective',
          }, {
            name: 'v-awesome-directive',
            as: 'AwesomeDirective',
          }],
        }],
      },
    })

    it('inject', async () => {
      expect(multipleDirectives.code).toMatchInlineSnapshot(`
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
      expect((await ctx.injectImports(multipleDirectives.code, 'a.vue')).code.toString()).toMatchInlineSnapshot(`
        "import { CustomDirective as _directive_custom_directive, AwesomeDirective as _directive_awesome_directive } from '/src/directives/index.ts';import { createElementVNode as _createElementVNode, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

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
})
