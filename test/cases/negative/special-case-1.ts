// https://github.com/nuxt/framework/issues/5435


const _hoisted_1 = { class: "watch" }
const _hoisted_2 = /*#__PURE__*/_createElementVNode("a", {
  href: "#",
  class: "ref computed"
}, " ¿Olvidaste tu contraseña? ", -1 /* HOISTED */)
const _hoisted_3 = [
  _hoisted_2
]
function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("div", _hoisted_1, _hoisted_3))
}
function ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${_ssrRenderAttrs(_mergeProps({ class: "watch" }, _attrs))}><a href="#" class="ref computed"> ¿Olvidaste tu contraseña? </a></div>`)
}
