import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import {DevTools} from '@vitejs/devtools'
import unimport from '../src/unplugin'
import { unimportViteOptions } from './configure-directives'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue(),
    DevTools(),
    unimport.vite(unimportViteOptions),
    Inspect(),
  ],
})
