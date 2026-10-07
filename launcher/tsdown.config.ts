import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: 'src/launcher.ts',
    outDir: 'dist/bundled',
    deps: {
        neverBundle: ['@aws-sdk/client-s3'],
        alwaysBundle: ['dotenv', 'semver'],
    },
})