import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    name: 'front',
    entry: 'src/front/index.ts',
    platform: 'neutral',
    fromVite: true,
    dts: { vue: true },
    outDir: 'dist/front',
  },
  {
    name: 'back',
    entry: 'src/back/index.ts',
    platform: 'neutral',
    fromVite: true,
    outDir: 'dist/back',
    exports: {
      customExports: {
        './front': './dist/front/index.js',
        './back': './dist/back/index.js',
      },
    },
  }
])
