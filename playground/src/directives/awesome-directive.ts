import type { DirectiveBinding } from 'vue'

export function AwesomeDirective(el: HTMLElement, binding: DirectiveBinding) {
  // eslint-disable-next-line no-console
  console.log('AwesomeDirective', el, binding)
}

export default AwesomeDirective
