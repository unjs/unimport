import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: '@solidjs/router',
  imports: [
    // Components
    'A',
    'Navigate',
    'Route',

    // Data APIs,
    'action',
    'createAsync',
    'createAsyncStore',
    'query',
    'useAction',
    'useSubmission',
    'useSubmissions',

    // Primitives
    'useBeforeLeave',
    'useCurrentMatches',
    'useIsRouting',
    'useLocation',
    'useMatch',
    'useNavigate',
    'useParams',
    'usePreloadRoute',
    'useSearchParams',

    // Response Helpers
    'json',
    'redirect',
    'reload',
    'revalidate',
  ],
})
