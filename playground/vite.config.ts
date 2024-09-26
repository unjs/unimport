import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import inspect from 'vite-plugin-inspect'
import unimport from '../src/unplugin'
import { unimportViteOptions } from './configure-directives'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    unimport.vite(unimportViteOptions),
    inspect(),
  ],
})
