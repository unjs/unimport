import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'quasar',
  imports: [
    // https://quasar.dev/vue-composables
    'useQuasar',
    'useDialogPluginComponent',
    'useFormChild',
    'useMeta',
  ],
})
