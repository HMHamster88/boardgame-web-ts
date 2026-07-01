import type { GameBackModule, GameBackService } from "boardgame-web-common/back"
import fs from 'fs'
import { createRequire } from "module";
import semver from 'semver'
import { Readable } from 'stream';
import unzipper from 'unzipper';
import type { DB, GameModule } from "./db/db.ts";
import path from 'node:path';

const gamesDir = './public/games-modules/'

function getDirectories(source: string) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}


let gameServices = new Map<string, GameBackService>()
let modulesMap = new Map<string, GameBackModule>()

function checkIfSEA() {
    try {
        const sea = require('node:sea');
        return sea.isSea();
    } catch (error) {
        return false;
    }
}

async function loadModule(dirName: string): Promise<GameBackModule> {
    const nodeEnv = process.env.NODE_ENV
    const isSea = checkIfSEA()
    if (isSea) {
        const fileRequire = createRequire(process.execPath);
        return fileRequire(gamesDir + dirName + "/back/index.mjs");
    }
    return import((nodeEnv == 'production' ? './' : '../') + gamesDir + dirName + '/back/index.mjs')
}

function getFileNameFromUrl(url: string) {
    const parsedUrl = new URL(url);
    const decodedPathname = decodeURIComponent(parsedUrl.pathname)
    return path.posix.basename(decodedPathname, path.posix.extname(decodedPathname))
}

async function downloadModule(dbModule: GameModule): Promise<GameBackModule | undefined> {
    console.log(`Downloading ${dbModule.homepage}`)
    const latestReleaseJson = await getLatestReleaseJson(dbModule.homepage)
    if (!latestReleaseJson) {
        return undefined
    }
    const downloadUrl = latestReleaseJson.assets[0].browser_download_url

    const response = await fetch(downloadUrl);
    if (!response.ok) {
        console.log(`Failed to download update for ${dbModule.homepage}`)
        return undefined
    }

    if (!response.body) {
        return
    }

    const directory = getFileNameFromUrl(downloadUrl)

    const extractPath = gamesDir + directory

    await Readable.fromWeb(response.body as any)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();

    console.log(`${dbModule.homepage} Unzipped`)

    const module = await loadModule(directory)

    dbModule.directory = directory

    return module
}

async function checkNeedUpdate(dbModule: GameModule) {
    console.log(`Checking update for ${dbModule.type}`)
    const latestReleaseJson = await getLatestReleaseJson(dbModule.homepage)
    if (!latestReleaseJson) {
        return false
    }
    const tagName = latestReleaseJson.tag_name as string
    const versionCompareResult = semver.compare(tagName, dbModule.version!)
    return versionCompareResult == 1
}

export async function loadServices(db: DB, checkForUpdates: boolean) {
    const dbModules = db.getGameModuels()

    const modules: GameBackModule[] = []

    for (let dbModule of dbModules) {
        let module: GameBackModule | undefined = undefined
        const moduleAlreadyDownloaded = dbModule.directory != undefined
        let needUpdateDbModule = false
        if (moduleAlreadyDownloaded) {
            if (checkForUpdates && await checkNeedUpdate(dbModule)) {
                console.log(`Updated needed for ${dbModule.type}`)
                module = await downloadModule(dbModule)
                needUpdateDbModule = true
            } else {
                module = await loadModule(dbModule.directory!)
            }
        } else {
            module = await downloadModule(dbModule)
            needUpdateDbModule = true
        }

        if (!module) {
            continue
        }
        const gameService = module.getGameBackService()
        gameServices.set(gameService.type, gameService)
        modulesMap.set(gameService.type, module)
        modules.push(module)
        if (needUpdateDbModule) {
            dbModule.type = gameService.type
            dbModule.version = gameService.version
            db.updateGameModule(dbModule)
        }
    }
    return modules
}

function getLatestReleaseJsonUrl(homepage: string): string | undefined {
    const match = homepage.match('https:\/\/github.com\/(.*)')
    if (!match) {
        return undefined
    }
    return `https://api.github.com/repos/${match[1]}/releases/latest`
}

async function getLatestReleaseJson(homepage: string) {
    const latestReleaseUrl = getLatestReleaseJsonUrl(homepage)
    if (!latestReleaseUrl) {
        console.log("Failed to fetch latest release url")
        return undefined
    }
    const response = await fetch(latestReleaseUrl);

    if (!response.ok) {
        console.log('Failed to get latest release json for ' + homepage)
        return undefined
    }

    return await response.json();
}

export function getAllGameServices() {
    return Array.from(gameServices.values())
}

export function getGameSerivce(gameType: string): GameBackService {
    return getAllGameServices().find(service => service.type == gameType)!
}