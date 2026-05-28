import { CatanFrontService } from './catanFrontService'

export const catanGameType = "CATAN"


export function getGameFrontService() {
    return new CatanFrontService()
}