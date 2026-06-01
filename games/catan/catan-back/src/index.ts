
import type { GameBackService } from 'boardgame-web-common/back'
import { CatanGameBackService } from './catanBackService'
export * from './types/types'
export * from './catanBackService'
export * from './types/catanTerrainHexType'
export * from './types/catanGameFieldType'
export * from './types/actions'
export * from './types/utils'


export function getGameBackService(): GameBackService {
    return new CatanGameBackService()
}