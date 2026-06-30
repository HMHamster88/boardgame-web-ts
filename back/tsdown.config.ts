import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: 'src/app.ts',
    outDir: 'dist/bundled',
    deps: {
        alwaysBundle: ['express', 'lodash', 'uuidv4', 'dotenv', 'connect-history-api-fallback', 'boardgame-web-common/back'],
    },
})