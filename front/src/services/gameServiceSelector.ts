import type { GameFrontModule, GameFrontService } from "front-common"
const gameServices = new Map<string, GameFrontService>()

export async function getGameSerivce(gameType: string): Promise<GameFrontService> {
    const loadedService = gameServices.get(gameType)
    if (loadedService) {
        return loadedService
    }
    let gameService: GameFrontService
    console.log('Loading module ' + gameType)
    switch (gameType) {
        case 'CATAN':
            const module = await import('catan-front') as GameFrontModule
            gameService = module.getGameFrontService()
            gameServices.set(gameType, gameService)
            break
    }
    return gameService!
}