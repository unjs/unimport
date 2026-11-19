import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'solid-js',
  imports: [
    // reactivity,
    'createDeferred',
    'createEffect',
    'createMemo',
    'createOptimistic',
    'createSignal',
    'flush',
    'from',
    'isPending',
    'latest',
    'untrack',

    // stores
    'createOptimisticStore',
    'createProjection',
    'createStore',
    'merge',
    'omit',
    'reconcile',

    // lifecycle actions
    'action',
    'affects',
    'onFlush',
    'onSettled',
    'refresh',
    'until',

    // components context
    'children',
    'createContext',
    'createUniqueId',
    'lazy',
    'lazyModule',
    'useContext',

    // components jsx
    'Errored',
    'For',
    'Loading',
    'Repeat',
    'Reveal',
    'Show',
    'Switch',
    'Match',
    'dynamicComponent',

    // advanced - owner introspection
    'createRoot',
    'getObserver',
    'getOwner',
    'isDisposed',
    'runWithOwner',

    // advanced - specialized reactivity
    'createReaction',
    'createRenderEffect',
    'createTrackedEffect',
    'onCleanup',

    // advanced - store advanced
    'deep',
    'isWrappable',
    'markRaw',
    'snapshot',

    // advanced - jsx components primitives
    'mapArray',
    'repeat',

    // advanced - manual hydration
    'Hydration',
    'isHydratable',
    'isHydrating',
    'NoHydration',
    'onHydrationEnd',

    // advanced - interop async
    'enableExternalSource',
    'flatten',
    'NotReadyError',
    'resolve',

    // types
    ...[
      // components / props
      'Component',
      'ComponentProps',
      'FlowComponent',
      'FlowProps',
      'ParentComponent',
      'ParentProps',
      'Ref',
      'ValidComponent',
      'VoidComponent',
      'VoidProps',

      // context
      'Context',
      'ContextProviderComponent',

      // owner / reactive values
      'Owner',
      'Accessor',
      'Setter',
      'Signal',
      'SourceAccessor',

      // store
      'Store',
      'SolidStore',
    ].map(name => ({ name, type: true })),
  ],
})
