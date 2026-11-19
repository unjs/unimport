import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: '@solidjs/meta',
  imports: [
    'Base',
    'Head',
    'Link',
    'Meta',
    'Script',
    'Style',
    'Stylesheet',
    'Title',
  ],
})
