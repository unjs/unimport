import { defineUnimportPreset } from '../utils'
import { CommonCompositionAPI } from './vue'

export default defineUnimportPreset({
  from: 'vue-demi',
  imports: CommonCompositionAPI,
})
