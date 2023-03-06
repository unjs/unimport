import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vuetify',
  imports: [
    'useDisplay',
    'useLayout',
    'useLocale',
    'useRtl',
    'useTheme'
  ]
})
