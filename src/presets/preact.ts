import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'preact',
  imports: [
    'useState',
    'useCallback',
    'useMemo',
    'useEffect',
    'useRef',
    'useContext',
    'useReducer'
  ]
})
