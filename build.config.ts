import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/unplugin.ts',
    'src/addons.ts',
  ],
  clean: true,
  declaration: 'node16',
})
