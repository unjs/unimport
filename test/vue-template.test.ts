import { describe, expect, test } from 'vitest'
import { createUnimport } from '../src'

const input = `
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock(), _createElementBlock("div", null, [
    _createElementVNode("h1", null, _toDisplayString($setup.count) + " x " + _toDisplayString(_ctx.multiplier) + " = " + _toDisplayString($setup.doubled), 1),
    _createElementVNode("button", { onClick: $setup.inc }, " Inc ")
  ]);
}
`

describe('vue-template', () => {
  const ctx = createUnimport({
    imports: [
      { name: 'multiplier', from: 'foo', as: 'multiplier' }
    ],
    addons: {
      vueTemplate: true
    }
  })

  test('inject', async () => {
    expect((await ctx.injectImports(input)).code.toString()).toMatchInlineSnapshot(`
      "import { multiplier as __unimport_multiplier } from 'foo';
      function _sfc_render(_ctx, _cache, \$props, \$setup, \$data, \$options) {
        return _openBlock(), _createElementBlock(\\"div\\", null, [
          _createElementVNode(\\"h1\\", null, _toDisplayString(\$setup.count) + \\" x \\" + _toDisplayString(__unimport_multiplier) + \\" = \\" + _toDisplayString(\$setup.doubled), 1),
          _createElementVNode(\\"button\\", { onClick: \$setup.inc }, \\" Inc \\")
        ]);
      }
      "
    `)
  })

  test('dts', () => {
    expect(ctx.generateTypeDecarations()).toMatchInlineSnapshot(`
      "declare global {
        const multiplier: typeof import('foo')['multiplier']
      }
      export {}"
    `)
  })
})
