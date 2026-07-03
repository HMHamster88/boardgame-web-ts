import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: 'src/app.ts',
    outDir: 'dist/bundled',
    deps: {
        neverBundle: ['@aws-sdk/client-s3'],
        alwaysBundle: ['express', 'uuidv4', 'dotenv', 'connect-history-api-fallback', 'boardgame-web-common', 'semver'],
    },
})