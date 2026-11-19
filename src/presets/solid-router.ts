import { defineUnimportPreset } from '../utils'

export const solidRouter = defineUnimportPreset({
  from: '@solidjs/router',
  imports: [
    // router factory
    'createRouter',
    'defineRoute',
    'defineRoutes',
    'eagerPreload',
    'intentPreload',
    'pendingLinks',
    'tapPreload',
    'viewportPreload',

    // navigation primitives
    'useBeforeLeave',
    'useHref',
    'useInRouter',
    'useIsRouting',
    'useLinkState',
    'useLocation',
    'useMatch',
    'useNavigate',
    'useParams',
    'usePreloadRoute',
    'useResolvedPath',
    'useRouteMatches',
    'useSearchParams',

    // data api
    'formAction',
    'liveQuery',
    'query',
    'revalidate',
    'useSubmissions',

    // history adapters
    'browserHistory',
    'hashHistory',
    'memoryHistory',

    // types
    ...[
      // history adapters
      'MemoryHistoryAdapter',
      'RouterHistory',

      // location
      'Location',
      'NavigateOptions',
      'RouteDefinition',
      'RouteProps',
      'RouterInstance',
    ].map(name => ({ name, type: true })),
  ],
})

export const solidRouterFS = defineUnimportPreset({
  from: '@solidjs/router/fs',
  imports: [
    'defineFileRoute',
    'fileRoutes',
  ],
})

export const solidRouterServer = defineUnimportPreset({
  from: '@solidjs/router/server',
  imports: [
    'createFlightDataCollector',
    { name: 'FlightDataCollectorOptions', type: true },
  ],
})
