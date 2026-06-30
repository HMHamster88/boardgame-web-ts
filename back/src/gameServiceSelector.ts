import type { GameBackModule, GameBackService } from "boardgame-web-common/back"
import fs from 'fs'
import { createRequire } from "module";

const gamesDir = './public/games-modules/'

function getDirectories(source: string) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

let modules: GameBackModule[] = []
let gameServices = new Map<string, GameBackService>()

function checkIfSEA() {
    try {
        const sea = require('node:sea');
        return sea.isSea();
    } catch (error) {
        return false;
    }
}

export async function loadServices() {
    const nodeEnv = process.env.NODE_ENV
    const isSea = checkIfSEA()
    const dirs = getDirectories(gamesDir)
    if (modules.length != 0) {
        return
    }
    modules = await Promise.all(
        dirs.map(dir => {
            if (isSea) {
                const fileRequire = createRequire(process.execPath);
                return fileRequire(gamesDir + dir + "/back/index.mjs");
            }
            return import((nodeEnv == 'production' ? './' : '../') + gamesDir + dir + '/back/index.mjs')
        })
    )
    gameServices = new Map<string, GameBackService>(modules.map((modules) => {
        const gameService = modules.getGameBackService()
        return [gameService.type, gameService]
    }))
    return modules
}


export function getAllGameServices() {
    return Array.from(gameServices.values())
}

export function getGameSerivce(gameType: string): GameBackService {
    return getAllGameServices().find(service => service.type == gameType)!
}