import { defineUnimportPreset } from '../utils'

export const nuxtTestUtilsE2E = defineUnimportPreset({
  from: '@nuxt/test-utils/e2e',
  imports: [
    'buildFixture',
    'createTest',
    'createTestContext',
    'exposeContextToEnv',
    'isDev',
    'loadFixture',
    'mockFn',
    'mockLogger',
    'recoverContextFromEnv',
    'runTests',
    'setTestContext',
    'setup',
    'setupMaps',
    'useTestContext',

    // types
    ...[
      'TestContext',
      'TestHooks',
      'TestOptions',
    ].map(name => ({ name, type: true })),
  ],
})

export const nuxtTestUtilsRuntime = defineUnimportPreset({
  from: '@nuxt/test-utils/runtime',
  imports: [
    'mockComponent',
    'mockNuxtImport',
    'mountSuspended',
    'registerEndpoint',
    'renderSuspended',
  ],
})
