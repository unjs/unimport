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
        // comment this inline preset and uncomment the directives in dirs
        /* {
          from: '/directives/awesome-directive.ts',
          imports: [
            {
              name: 'default',
              meta: {
                vueDirective: true,
              },
            },
          ],
        }, */
      ],
      dirs: [
        './composables/**',
        './directives/**',
      ],
      addons: {
        vueTemplate: true,
        vueDirectives: {
          isDirective(normalizeImportFrom, _importEntry) {
            return normalizeImportFrom.includes('/directives/')
          },
        },
      },
    }),
    inspect(),
  ],
})
