import { configDotenv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs'
import { homedir } from 'node:os';
import { createRequire } from "module";
import packageInfo from '../../package.json' with { type: 'json' };
configDotenv();

function checkIfSEA() {
    try {
        const sea = require('node:sea');
        return sea.isSea();
    } catch (error) {
        return false;
    }
}

async function loadModule(bundleDir: string): Promise<any> {
    const isSea = checkIfSEA()
    if (isSea) {
        const fileRequire = createRequire(process.execPath);
        return fileRequire(path.join(bundleDir, "index.mjs"));
    }
    return import('file://' + path.join(bundleDir, 'index.mjs'))
}

async function loadAndStartCoreModule(modulePath: string) {
    console.log(`Loading boardgame-web-ts core module from '${modulePath}'...`)
    const module = await loadModule(modulePath)
    console.log('Module loaded')
    const publicDir = path.join(modulePath, 'public')
    module.start(publicDir)
}

console.log(`Starting launcher`)
console.log(`Version ${packageInfo.version}`)

const dataDir = process.env.DATA_DIR || path.join(homedir(), 'boardgame-web-ts')
const coreModulesDir = path.join(dataDir, 'core')

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}

if (process.env.CORE_MODULE_DIR) {
    console.log('Received CORE_MODULE_DIR from .env')
    loadAndStartCoreModule(process.env.CORE_MODULE_DIR)
} else {
    loadAndStartCoreModule(path.join(coreModulesDir, 'bundled'))
}




