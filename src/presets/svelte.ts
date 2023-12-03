import { defineUnimportPreset } from '../utils'

export const svelteAnimate = defineUnimportPreset({
  from: 'svelte/animate',
  imports: [
    'flip',
  ],
})

export const svelteEasing = defineUnimportPreset({
  from: 'svelte/easing',
  imports: [
    'back',
    'bounce',
    'circ',
    'cubic',
    'elastic',
    'expo',
    'quad',
    'quart',
    'quint',
    'sine',
  ].reduce((acc, e) => {
    acc.push(`${e}In`, `${e}Out`, `${e}InOut`)
    return acc
  }, ['linear']),
})

export const svelteStore = defineUnimportPreset({
  from: 'svelte/store',
  imports: [
    'writable',
    'readable',
    'derived',
    'get',
  ],
})

export const svelteMotion = defineUnimportPreset({
  from: 'svelte/motion',
  imports: [
    'tweened',
    'spring',
  ],
})

export const svelteTransition = defineUnimportPreset({
  from: 'svelte/transition',
  imports: [
    'fade',
    'blur',
    'fly',
    'slide',
    'scale',
    'draw',
    'crossfade',
  ],
})

export const svelte = defineUnimportPreset({
  from: 'svelte',
  imports: [
    // lifecycle
    'onMount',
    'beforeUpdate',
    'afterUpdate',
    'onDestroy',
    // tick
    'tick',
    // context
    'setContext',
    'getContext',
    'hasContext',
    'getAllContexts',
    // event dispatcher
    'createEventDispatcher',
  ],
})
