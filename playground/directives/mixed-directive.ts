import type { DirectiveBinding } from 'vue'

export function NamedMixedDirective(el: HTMLElement, binding: DirectiveBinding) {
  // eslint-disable-next-line no-console
  console.log('NamedMixedDirective', el, binding)
}

export default function DefaultMixedDirective(el: HTMLElement, binding: DirectiveBinding) {
  // eslint-disable-next-line no-console
  console.log('DefaultMixedDirective', el, binding)
}
