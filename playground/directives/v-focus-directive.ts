import type { DirectiveBinding } from 'vue'

function VFocusDirective(el: HTMLElement, binding: DirectiveBinding) {
  // eslint-disable-next-line no-console
  console.log('FocusDirective', el, binding)
}

export default VFocusDirective
