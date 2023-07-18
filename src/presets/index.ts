/* eslint-disable object-shorthand */
import pinia from './pinia'
import preact from './preact'
import quasar from './quasar'
import react from './react'
import reactRouter from './react-router'
import reactRouterDom from './react-router-dom'
import {
  svelte,
  svelteAnimate,
  svelteEasing,
  svelteMotion,
  svelteStore,
  svelteTransition
} from './svelte'
import veeValidate from './vee-validate'
import vitepress from './vitepress'
import vue from './vue'
import vueMacros from './vue-macros'
import vueDemi from './vue-demi'
import vueI18n from './vue-i18n'
import vueRouter from './vue-router'
import vueCompositionApi from './vue-composition-api'
import vueuseCore from './vueuse-core'
import vueuseHead from './vueuse-head'
import vuex from './vuex'
import vitest from './vitest'
import uniApp from './uni-app'
import solid from './solid'
import solidAppRouter from './solid-app-router'
import vueRouterComposables from './vue-router-composables'
import rxjs from './rxjs'

export const builtinPresets = {
  '@vue/composition-api': vueCompositionApi,
  '@vueuse/core': vueuseCore,
  '@vueuse/head': vueuseHead,
  pinia: pinia,
  preact: preact,
  quasar: quasar,
  react: react,
  'react-router': reactRouter,
  'react-router-dom': reactRouterDom,
  svelte: svelte,
  'svelte/animate': svelteAnimate,
  'svelte/easing': svelteEasing,
  'svelte/motion': svelteMotion,
  'svelte/store': svelteStore,
  'svelte/transition': svelteTransition,
  'vee-validate': veeValidate,
  vitepress: vitepress,
  'vue-demi': vueDemi,
  'vue-i18n': vueI18n,
  'vue-router': vueRouter,
  'vue-router-composables': vueRouterComposables,
  vue: vue,
  'vue/macros': vueMacros,
  vuex: vuex,
  vitest: vitest,
  'uni-app': uniApp,
  'solid-js': solid,
  'solid-app-router': solidAppRouter,
  rxjs: rxjs
}

export type BuiltinPresetName = keyof typeof builtinPresets
