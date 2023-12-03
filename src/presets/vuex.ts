import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vuex',
  imports: [
    // https://next.vuex.vuejs.org/api/#createstore
    'createStore',
    // https://github.com/vuejs/vuex/blob/4.0/types/logger.d.ts#L20
    'createLogger',
    // https://next.vuex.vuejs.org/api/#component-binding-helpers
    'mapState',
    'mapGetters',
    'mapActions',
    'mapMutations',
    'createNamespacedHelpers',
    // https://next.vuex.vuejs.org/api/#composable-functions
    'useStore',
  ],
})
