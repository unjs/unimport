import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unimport from '../src/unplugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    unimport.vite({
      dts: true,
      presets: [
        'vue'
      ]
    })
  ]
})
