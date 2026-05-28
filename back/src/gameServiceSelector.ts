import type { GameBackModule, GameBackService } from "back-common"

let modules: GameBackModule[] = []
let gameServices = new Map<string, GameBackService>()

export async function loadServices() {
    const catanModule = await import('catan-back') as GameBackModule
    modules = [
        catanModule
    ]
    modules.forEach(module => {
        const service = module.getGameBackService()
        gameServices.set(service.type, service)
    })
    return modules
}


export function getAllGameServices() {
    return Array.from(gameServices.values())
}

export function getGameSerivce(gameType: string): GameBackService {
    return getAllGameServices().find(service => service.type == gameType)!
}