import type { TypedMessage } from "./messageHandler"
import type { ObjectSync } from "./objectSync"
import type { GameAction } from "./wsMessages"

export enum ConnectStatus {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED'
}

export enum UserRole {
    ADMIN = 'ADMIN'
}

export interface User {
    id: string
    name: string
    color: string,
    roles: UserRole[]
}

export interface GameType {
    type: string
    localizedName: any,
    diectoryName: string
}

export enum GameStatusEnum {
    CREATED = "CREATED",
    STARTED = "STARTED",
    FINISHED = "FINISHED",
}


export interface CreateGameProps {
    name: string
    type: string
    owner: string
}

export interface GameStaticSettings {
    minPlayers: number
    maxPlayers: number
}

export interface GameSettings {
    id: string
}


export interface GameContext {
    game: Game
    gameSync: ObjectSync<Game>
    gameSettings: GameSettings
    gameSettingsSync: ObjectSync<GameSettings>
    gameState: GameState | undefined
    gamePublicStateSync: ObjectSync<GamePublicState> | undefined
    playerPrivateStateSync: Map<string, ObjectSync<PlayerPrivateState>>
    sendNotify(peerId: string | undefined, message: string, messageParams: any | undefined): void
}

export interface BotGameContext {
    game: Game
    gameSettings: GameSettings
    gameState: GameState
    performGameAction: (action: GameAction, playerId: string) => Promise<void>
}

export interface GameBackService {
    type: string
    localizedName: any
    gameStaticSettings: GameStaticSettings
    getDefaultSettings(): GameSettings
    performAction(gameContext: GameContext, gameAction: GameAction, playerId: string): Promise<void>
    startGame(game: Game, gameSettings: GameSettings): GameState
    runBotsActions(botGameContext: BotGameContext): Promise<void>
    version: string
    homepage: string
}


export interface Player {
    userId: string
    name: string
    color: string
    online: boolean
    isBot: boolean
}

export interface Game {
    id: string;
    owner: string
    name: string
    type: string
    players: Player[]
    status: GameStatusEnum
    created: Date
}

export interface GameBackModule {
    getGameBackService: () => GameBackService;
}

export interface PlayerPublicState {
    playerId: string
    points: number | null
}

export interface PlayerPrivateState {
    playerId: string
}

export interface GameStatistics {
    turnCount: number
}

export interface GamePublicState {
    activePlayerIndex: number
    playersStates: PlayerPublicState[] | null
    winnersIds: string[]
    statistics: GameStatistics
}

export interface GamePrivateState {
    playersStates: PlayerPrivateState[] | null
}

export interface GameState {
    id: string // equals to game id
    publicState: GamePublicState
    privateState: GamePrivateState | null
}