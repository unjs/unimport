import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vue-toastify',
  imports: [
    'useToast',
    'useVtSettings',
    'useVtEvents',
  ],
})
