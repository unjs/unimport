import { defineUnimportPreset } from '../utils'

export const alovaCore = defineUnimportPreset({
  from: 'alova',
  imports: [
    'createAlova',
    'globalConfig',
    'Method',

    // cache actions
    'queryCache',
    'setCache',
    'invalidateCache',
    'hitCacheBySource',
  ],
})

export const alovaClient = defineUnimportPreset({
  from: 'alova/client',
  imports: [
    // core hooks
    'useRequest',
    'useWatcher',
    'useFetcher',

    // scenario hooks
    'usePagination',
    'useSQRequest',
    'useForm',
    'useAutoRequest',
    'useCaptcha',
    'useRetriableRequest',
    'useSSE',
    'useSerialRequest',
    'useSerialWatcher',

    // interceptors
    'createClientTokenAuthentication',
    'createServerTokenAuthentication',

    // middlewares
    'actionDelegationMiddleware',
    'accessAction',

    // silent queue related
    'bootSilentFactory',
    'onBeforeSilentSubmit',
    'onSilentSubmitBoot',
    'onSilentSubmitError',
    'onSilentSubmitFail',
    'onSilentSubmitSuccess',
    'silentQueueMap',
    'dehydrateVData',
    'equals',
    'filterSilentMethods',
    'getSilentMethod',
    'isVData',
    'stringifyVData',
    'updateStateEffect',

    // others
    'updateState',
  ],
})

export const alovaServer = defineUnimportPreset({
  from: 'alova/server',
  imports: ['HookedMethod', 'createRateLimiter', 'retry'],
})

export const statesHookVue = defineUnimportPreset({
  from: 'alova/vue',
  imports: [
    ['default', 'statesHookVue'],
  ],
})

export const statesHookReact = defineUnimportPreset({
  from: 'alova/react',
  imports: [
    ['default', 'statesHookReact'],
  ],
})

export const statesHookSvelte = defineUnimportPreset({
  from: 'alova/svelte',
  imports: [
    ['default', 'statesHookSvelte'],
  ],
})

export const adapterFetch = defineUnimportPreset({
  from: 'alova/fetch',
  imports: [
    ['default', 'adapterFetch'],
  ],
})
