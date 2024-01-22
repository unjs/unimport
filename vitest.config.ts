import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        'src/presets',
        'src/unplugin.ts',
      ],
      include: ['src'],
    },
  },
})
