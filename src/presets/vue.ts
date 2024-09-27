import type { InlinePreset } from '../types'
import { defineUnimportPreset } from '../utils'

export const CommonCompositionAPI: InlinePreset['imports'] = [
  // lifecycle
  'onActivated',
  'onBeforeMount',
  'onBeforeUnmount',
  'onBeforeUpdate',
  'onErrorCaptured',
  'onDeactivated',
  'onMounted',
  'onServerPrefetch',
  'onUnmounted',
  'onUpdated',

  // setup helpers
  'useAttrs',
  'useSlots',

  // reactivity,
  'computed',
  'customRef',
  'isReadonly',
  'isRef',
  'isProxy',
  'isReactive',
  'markRaw',
  'reactive',
  'readonly',
  'ref',
  'shallowReactive',
  'shallowReadonly',
  'shallowRef',
  'triggerRef',
  'toRaw',
  'toRef',
  'toRefs',
  'toValue',
  'unref',
  'watch',
  'watchEffect',
  'watchPostEffect',
  'watchSyncEffect',

  // component
  'defineComponent',
  'defineAsyncComponent',
  'getCurrentInstance',
  'h',
  'inject',
  'nextTick',
  'provide',
  'useCssModule',
  'createApp',

  // effect scope
  'effectScope',
  'EffectScope',
  'getCurrentScope',
  'onScopeDispose',

  // types
  ...[
    'Component',
    'ComponentPublicInstance',
    'ComputedRef',
    'DirectiveBinding',
    'ExtractDefaultPropTypes',
    'ExtractPropTypes',
    'ExtractPublicPropTypes',
    'InjectionKey',
    'PropType',
    'Ref',
    'MaybeRef',
    'MaybeRefOrGetter',
    'VNode',
    'WritableComputedRef',
  ].map(name => ({ name, type: true })),
]

export default defineUnimportPreset({
  from: 'vue',
  imports: [
    ...CommonCompositionAPI,

    // vue3 only
    'onRenderTracked',
    'onRenderTriggered',
    'resolveComponent',
    'useCssVars',

    // vue3.4+
    'useModel',

    // vue3.5+
    'onWatcherCleanup',
    'useId',
    'useTemplateRef',
  ],
})
