import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'temporal-polyfill',
  imports: ['Temporal'],
  type: true,
})
