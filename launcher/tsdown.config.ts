import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: 'src/launcher.ts',
    outDir: 'dist/bundled',
    deps: {
        alwaysBundle: ['dotenv', 'semver'],
    },
})