import type { GameBackService } from './dto'

export * from './wsMessages'
export * from './messageHandler'
export * from './arrayUtils'
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