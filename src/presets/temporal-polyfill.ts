import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'temporal-polyfill/global',
  imports: [
    {
      name: 'default',
    },
  ],
})
