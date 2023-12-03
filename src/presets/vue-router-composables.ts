import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vue-router/composables',
  imports: [
    'useRouter',
    'useRoute',
    'useLink',
    'onBeforeRouteLeave',
    'onBeforeRouteUpdate',
  ],
})
