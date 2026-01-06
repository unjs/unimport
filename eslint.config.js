import antfu from '@antfu/eslint-config'

export default antfu(
  {
    pnpm: true,
    ignores: [
      'test/cases',
      'playground',
    ],
  },
)
