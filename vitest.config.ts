import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/presets'
      ]
    }
  }
})
