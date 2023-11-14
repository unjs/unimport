import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'pinia',
  imports: [
    // https://pinia.esm.dev/api/modules/pinia.html#functions
    'acceptHMRUpdate',
    'createPinia',
    'defineStore',
    'getActivePinia',
    'mapActions',
    'mapGetters',
    'mapState',
    'mapStores',
    'mapWritableState',
    'setActivePinia',
    'setMapStoreSuffix',
    'storeToRefs',
  ],
})
