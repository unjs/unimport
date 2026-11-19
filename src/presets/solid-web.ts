import { defineUnimportPreset } from '../utils'

export const solidWeb = defineUnimportPreset({
  from: '@solidjs/web',
  imports: [
    // rendering ssr
    'clientOnly',
    'getHydrationWriter',
    'httpHeader',
    'httpStatus',
    'hydrate',
    'isDev',
    'isServer',
    'renderToStream',
    'renderToString',
    'render',
    'setTrustedTypesPolicy',
    'takeHydrationValue',

    // head
    'useHead',

    // components
    'dynamic',
    'Portal',

    // request response
    'configureServerErrors',
    'reportRequestFailure',
    'parseCookieHeader',
    'serializeCookie',
    'getRequestEvent',
    'getTraceContext',
    'redirect',
    'isHref',
    'reload',
    'respond',
    'isResponseEnvelope',
    'markSafeError',
    'isSafeError',

    // types
    ...[
      'JSX',

      // head
      'HeadTag',
    ].map(name => ({ name, type: true })),
  ],
})

export const solidWebServerFunctions = defineUnimportPreset({
  from: '@solidjs/web/server-functions',
  imports: [
    'parseServerFunctionActionUrl',
    'serverFunctionActionUrl',
    'serverFunctionUrl',
    'broadcast',
    'configureServerFunctionsClient',
    'GET',
    'getServerFunctionInvocation',
    'invoke',
    'live',
    'withMeta',
    'getServerFunctionMetadata',
    'isServerFunction',
    'decodeResponse',
    'subscribeFlightData',
  ],
})

export const solidWebServerFunctionsServer = defineUnimportPreset({
  from: '@solidjs/web/server-functions/server',
  imports: [
    'configureServerFunctionsServer',
    'handleServerFunctionRequest',
    'createNoJSHandler',
    'registerFlightDataSource',
  ],
})

export const solidWebServerFunctionsRichArgs = defineUnimportPreset({
  from: '@solidjs/web/server-functions/rich-args',
  imports: [
    'enableRichArguments',
  ],
})

export const solidWebStorage = defineUnimportPreset({
  from: '@solidjs/web/storage',
  imports: [
    'provideRequestEvent',
  ],
})
