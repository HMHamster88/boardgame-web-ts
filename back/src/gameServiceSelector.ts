/*import { createInstance } from '@module-federation/enhanced/runtime';
import type { GameBackModule } from 'boardgame-web-common/back';

export async function getGameService(type: string) {
    const lowerType = type.toLocaleLowerCase()
    const mf = createInstance({
        name: 'host-back-app',
        remotes: [
            {
                name: lowerType,
                entry: 'http://localhost:8000/games-modules/' + lowerType + '/back/remoteEntry.js',
                type: 'module'
            },
        ],
    });

    const module = await mf.loadRemote<GameBackModule>(lowerType + '/back')

    console.log("GS module", module)
    return module?.getGameBackService()
}*/

import type { GameBackModule, GameBackService } from "boardgame-web-common/back"
import fs from 'fs'

const gamesDir = './public/games-modules'

function getDirectories(source: string) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

let modules: GameBackModule[] = []
let gameServices = new Map<string, GameBackService>()

export async function loadServices() {
    const dirs = getDirectories(gamesDir)
    if (modules.length != 0) {
        return
    }
    modules = await Promise.all(
        dirs.map(dir => {
            return import('../' + gamesDir + '/' + dir + '/back/index.mjs')
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