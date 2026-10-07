import { configDotenv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs'
import { homedir } from 'node:os';
import { createRequire } from "module";
import packageInfo from '../../package.json' with { type: 'json' };
import semver from 'semver'
import { Readable } from 'stream';
import unzipper from 'unzipper';


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

const versionRegex = /(\d+\.\d+.\d+)/;

function getVersionFromFileName(fileName: string) {
    const match = versionRegex.exec(fileName)
    if (!match) {
        return undefined
    }
    return match[1]
}

function getLatestReleaseJsonUrl(homepage: string): string | undefined {
    const match = homepage.match('https:\/\/github.com\/(.*)')
    if (!match) {
        return undefined
    }
    return `https://api.github.com/repos/${match[1]}/releases/latest`
}

interface Asset {
    name: string
    browser_download_url: string
}

interface LatestRelease {
    tag_name: string
    assets: Asset[]
}

async function getLatestReleaseJson(homepage: string): Promise<LatestRelease> {
    const latestReleaseUrl = getLatestReleaseJsonUrl(homepage)
    if (!latestReleaseUrl) {
        throw new Error("Failed to fetch latest release url")
    }
    const response = await fetch(latestReleaseUrl);

    if (!response.ok) {
        throw new Error('Failed to get latest release json for ' + homepage)
    }

    return await response.json() as LatestRelease;
}

function getFileNameFromUrl(url: string) {
    const parsedUrl = new URL(url);
    const decodedPathname = decodeURIComponent(parsedUrl.pathname)
    return path.posix.basename(decodedPathname, path.posix.extname(decodedPathname))
}

async function downloadModule(latestRelease: LatestRelease): Promise<any> {
    const coreModuleAsset = latestRelease.assets.find(asset => asset.name.startsWith('boardgame-web-ts-core-module'))
    if (!coreModuleAsset) {
        throw new Error('Failed to find latest asset')
    }

    const downloadUrl = coreModuleAsset.browser_download_url

    const response = await fetch(downloadUrl);
    if (!response.ok) {
        throw new Error(`Failed to download core module`)
    }

    if (!response.body) {
        throw new Error(`Failed to download core module. No respnse body`)
    }

    const directory = getFileNameFromUrl(downloadUrl)

    const extractPath = path.join(coreModulesDir, directory)

    await Readable.fromWeb(response.body as any)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();
}

interface ModuleDir {
    name: string
    version: string
}

function getExistingModulesDirs() {
    return fs.readdirSync(coreModulesDir, { withFileTypes: true })
        .filter(file => file.isDirectory())
        .map(dir => {
            const version = getVersionFromFileName(dir.name)
            if (!version) {
                return undefined
            }
            return {
                name: dir.name,
                version: version
            } as ModuleDir
        })
        .filter(dir => dir != undefined)
        .sort((a, b) => {
            return semver.compare(b.version, a.version)
        })
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
    let existingModulesDirs = getExistingModulesDirs()
    console.log('Existing core modules', existingModulesDirs)
    try {
        if (existingModulesDirs.length == 0 || process.env.CHECK_FOR_UPDATES) {
            const latestReleaseJson = await getLatestReleaseJson(packageInfo.homepage)
            const tagName = latestReleaseJson.tag_name as string
            const latestExistiongVersion = existingModulesDirs[0]?.version
            if (!latestExistiongVersion || (latestExistiongVersion && semver.compare(tagName, latestExistiongVersion!) == 1)) {
                console.log(`Downloading core module...`)
                await downloadModule(latestReleaseJson)
                console.log(`Downloading core module finished`)
            }
        }
    } catch (error) {
        console.error(error)
    }
    existingModulesDirs = getExistingModulesDirs()
    if (existingModulesDirs.length > 0) {
        const latestModule = existingModulesDirs[0]!
        loadAndStartCoreModule(path.join(coreModulesDir, latestModule.name))
    } else {
        console.error('No core modules to load')
    }
}




