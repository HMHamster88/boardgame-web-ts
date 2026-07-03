import type { GameBackService } from './dto'

export * from './wsMessages'
export * from './messageHandler'
export * from './utils/arrayUtils'
export * from './utils/randomUtils'
export * from './utils/objectUtils'
export * from './dto'
export * from './types/vector2d'
export * from './types/hex-grid/geometry'
export * from './types/hex-grid/hexData'
export * from './objectSync'
export * from './proxyObject'
export * from './connection'


export interface GameBackModule {
    getGameBackService: () => GameBackService;
}