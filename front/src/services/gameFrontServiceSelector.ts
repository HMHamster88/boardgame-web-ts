import { createInstance } from '@module-federation/enhanced/runtime';
import type { GameType } from 'boardgame-web-common';
import type { GameFrontModule, GameFrontService } from 'boardgame-web-common/front';
const vue = await import('vue')
const boardgameWebCommon = await import('boardgame-web-common')
const oruga = await import('@oruga-ui/oruga-next')
const lodash = await import('lodash')

const gameServices = new Map<string, GameFrontService>()

export async function getGameService(type: GameType) {
    const loadedService = gameServices.get(type.type)
    if (loadedService) {
        return loadedService
    }
    const lowerType = type.type.toLocaleLowerCase()
    const mf = createInstance({
        name: 'host-back-app',
        remotes: [
            {
                name: lowerType,
                entry: '/games-modules/' + type.diectoryName + '/front/assets/remoteEntry.js',
                type: 'module'
            }
        ],
        shareStrategy: 'loaded-first',
        shared: {
            'vue': {
                shareConfig: {
                    singleton: true,
                    requiredVersion: "^3.5.34"
                },
                get: () => () => vue as any
            },
            'boardgame-web-common': {
                get: () => () => boardgameWebCommon as any
            },
            '@oruga-ui/oruga-next': {
                get: () => () => oruga as any
            },
            'lodash': {
                get: () => () => lodash as any
            }
        }
    });

    const module = await mf.loadRemote(lowerType + '/front') as GameFrontModule
    const service = module.getGameFrontService()
    console.log("Game service loaded", service)
    gameServices.set(type.type, service)
    return service
}

