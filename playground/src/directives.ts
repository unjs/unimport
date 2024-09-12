import type { DirectiveBinding } from 'vue'

function mounted(el: HTMLElement, binding: DirectiveBinding) {
  console.log('mounted', el, binding)
}

function unmounted(el: HTMLElement, binding: DirectiveBinding) {
  console.log('unmounted', el, binding)
}

function updated(el: HTMLElement, binding: DirectiveBinding) {
  console.log('updated', el, binding)
}

export const CustomDirective = {
  mounted,
  unmounted,
  updated,
}

export function AwesomeDirective(el: HTMLElement, binding: DirectiveBinding) {
  console.log('AwesomeDirective', el, binding)
}
