import { expect, test } from 'vitest'
import { createUnimport } from '../src'
import { vueTemplateAutoImport } from '../src/vue-sfc'

const input = `
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock(), _createElementBlock("div", null, [
    _createElementVNode("h1", null, _toDisplayString($setup.count) + " x " + _toDisplayString(_ctx.multiplier) + " = " + _toDisplayString($setup.doubled), 1),
    _createElementVNode("button", { onClick: $setup.inc }, " Inc ")
  ]);
}
`

test('vue-sfc', () => {
  const ctx = createUnimport({
    imports: [
      { name: 'multiplier', from: 'foo', as: 'multiplier' }
    ]
  })

  expect(vueTemplateAutoImport(input, ctx)).toMatchInlineSnapshot(`
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
