import dateFns from './date-fns'
import pinia from './pinia'
import preact from './preact'
import quasar from './quasar'
import react from './react'
import reactRouter from './react-router'
import reactRouterDom from './react-router-dom'
import rxjs from './rxjs'
import solid from './solid'
import solidAppRouter from './solid-app-router'
import {
  svelte,
  svelteAnimate,
  svelteEasing,
  svelteMotion,
  svelteStore,
  svelteTransition,
} from './svelte'
import uniApp from './uni-app'
import veeValidate from './vee-validate'
import vitepress from './vitepress'
import vitest from './vitest'
import vue from './vue'
import vueCompositionApi from './vue-composition-api'
import vueDemi from './vue-demi'
import vueI18n from './vue-i18n'
import vueMacros from './vue-macros'
import vueRouter from './vue-router'
import vueRouterComposables from './vue-router-composables'
import vueTestUtils from './vue-test-utils'
import vueuseCore from './vueuse-core'
import vueuseHead from './vueuse-head'
import vuex from './vuex'

export const builtinPresets = {
  '@vue/composition-api': vueCompositionApi,
  '@vueuse/core': vueuseCore,
  '@vueuse/head': vueuseHead,
  '@vue/test-utils': vueTestUtils,
  'pinia': pinia,
  'preact': preact,
  'quasar': quasar,
  'react': react,
  'react-router': reactRouter,
  'react-router-dom': reactRouterDom,
  'svelte': svelte,
  'svelte/animate': svelteAnimate,
  'svelte/easing': svelteEasing,
  'svelte/motion': svelteMotion,
  'svelte/store': svelteStore,
  'svelte/transition': svelteTransition,
  'vee-validate': veeValidate,
  'vitepress': vitepress,
  'vue-demi': vueDemi,
  'vue-i18n': vueI18n,
  'vue-router': vueRouter,
  'vue-router-composables': vueRouterComposables,
  'vue': vue,
  'vue/macros': vueMacros,
  'vuex': vuex,
  'vitest': vitest,
  'uni-app': uniApp,
  'solid-js': solid,
  'solid-app-router': solidAppRouter,
  'rxjs': rxjs,
  'date-fns': dateFns,
}

export type BuiltinPresetName = keyof typeof builtinPresets
