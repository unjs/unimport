import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'react',
  imports: [
    'useState',
    'useCallback',
    'useMemo',
    'useEffect',
    'useRef',
    'useContext',
    'useReducer',
  ],
})
