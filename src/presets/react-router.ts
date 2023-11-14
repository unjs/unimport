import { defineUnimportPreset } from '../utils'

/**
 * Only compatible with React Router v6.
 */
export const ReactRouterHooks = [
  'useOutletContext',
  'useHref',
  'useInRouterContext',
  'useLocation',
  'useNavigationType',
  'useNavigate',
  'useOutlet',
  'useParams',
  'useResolvedPath',
  'useRoutes',
]

export default defineUnimportPreset({
  from: 'react-router',
  imports: [
    ...ReactRouterHooks,
  ],
})
