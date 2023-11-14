import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vitest',
  imports: [
    // suite
    'suite',
    'test',
    'describe',
    'it',
    // chai
    'chai',
    'expect',
    'assert',
    // utils
    'vitest',
    'vi',
    // hooks
    'beforeAll',
    'afterAll',
    'beforeEach',
    'afterEach',
  ],
})
