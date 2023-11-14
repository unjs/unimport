import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vitepress',
  imports: [
    // helper methods
    'useData',
    'useRoute',
    'useRouter',
    'withBase',
  ],
})
