import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: '@vue/test-utils',
  imports: [
    'createWrapperError',
    'disableAutoUnmount',
    'enableAutoUnmount',
    'flushPromises',
    'mount',
    'renderToString',
    'shallowMount',

    // types
    ...[
      'BaseWrapper',
      'ComponentMountingOptions',
      'DOMWrapper',
      'MountingOptions',
      'RouterLinkStub',
      'VueWrapper',
    ].map(name => ({ name, type: true })),
  ],
})
