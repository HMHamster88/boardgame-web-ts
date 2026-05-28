import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: 'browser',
  exports: true,
  fromVite: true,
  dts: { vue: true },
  format: {
    esm: {
      target: ['esnext']
    }
  },
  minify: false,
  loader: {
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".webp": "dataurl"
  },
  css: {
    minify: true,
    inject: true,
    fileName: 'index.css',
  }
})
