import { defineConfig } from 'tsdown'

export default defineConfig({
    outDir: 'dist/bundled',
    dts: {
        tsgo: false,
    },
    exports: true,
    deps: {
        neverBundle: ['@aws-sdk/client-s3'],
        alwaysBundle: ['express', 'uuidv4', 'dotenv', 'connect-history-api-fallback', 'boardgame-web-common', 'semver'],
    },
})