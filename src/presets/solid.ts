import { defineUnimportPreset } from '../utils'

export const solidCore = defineUnimportPreset({
  from: 'solid-js',
  imports: [
    'createSignal',
    'createEffect',
    'createMemo',
    'createResource',
    'onMount',
    'onCleanup',
    'onError',
    'untrack',
    'batch',
    'on',
    'createRoot',
    'mergeProps',
    'splitProps',
    'useTransition',
    'observable',
    'mapArray',
    'indexArray',
    'createContext',
    'useContext',
    'children',
    'lazy',
    'createDeferred',
    'createRenderEffect',
    'createSelector',
    'For',
    'Show',
    'Switch',
    'Match',
    'Index',
    'ErrorBoundary',
    'Suspense',
    'SuspenseList',
  ],
})

export const solidStore = defineUnimportPreset({
  from: 'solid-js/store',
  imports: [
    'createStore',
    'produce',
    'reconcile',
    'createMutable',
  ],
})

export const solidWeb = defineUnimportPreset({
  from: 'solid-js/web',
  imports: [
    'Dynamic',
    'hydrate',
    'render',
    'renderToString',
    'renderToStringAsync',
    'renderToStream',
    'isServer',
    'Portal',
  ],
})

export default defineUnimportPreset({
  from: 'solid-js',
  imports: [
    solidCore,
    solidStore,
    solidWeb,
  ],
})
