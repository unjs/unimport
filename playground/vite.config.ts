import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import inspect from 'vite-plugin-inspect'
import unimport from '../src/unplugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    unimport.vite({
      dts: true,
      presets: [
        'vue',
      ],
      dirs: [
        './composables/**',
      ],
      addons: {
        vueTemplate: true,
        vueDirectives: [{
          from: '/src/directives/index.ts',
          directives: [{
            directive: 'v-custom-directive',
            name: 'CustomDirective',
            // as: 'CustomDirective',
          }, {
            directive: 'v-awesome-directive',
            name: 'AwesomeDirective',
            // as: 'AwesomeDirective',
          }],
        }],
      },
    }),
    inspect(),
  ],
})
