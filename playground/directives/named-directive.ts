import type { DirectiveBinding } from 'vue'

export function NamedDirective(el: HTMLElement, binding: DirectiveBinding) {
  // eslint-disable-next-line no-console
  console.log('NamedDirective', el, binding)
}
