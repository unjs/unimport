import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vue-router',
  imports: [
    'useRouter',
    'useRoute',
    'useLink',
    'onBeforeRouteLeave',
    'onBeforeRouteUpdate',
  ],
})
