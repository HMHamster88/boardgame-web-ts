import type { CreateGameProps, Game, GameSettings, GameState, GameType, Player, User } from "./dto.js"
import type { TypedMessage } from "./messageHandler.js"

export interface HandshakeRequest extends TypedMessage {
    type: 'HandshakeRequest'
    userId: string
}

export interface HandshakeResponse extends TypedMessage {
    type: 'HandshakeResponse'
    user: User
    gameTypes: GameType[]
}

export interface GetAllGamesRequest extends TypedMessage {
    type: 'GetAllGamesRequest'
}

export interface AllGamesResponse extends TypedMessage {
    type: 'AllGamesResponse'
    games: Game[]
}

export interface GetGameRequest extends TypedMessage {
    type: 'GetGameRequest'
}

export interface GetGameResponse extends TypedMessage {
    type: 'GetGameResponse'
    game: Game
    gameSettings: GameSettings
}

export interface CreateGameRequest extends TypedMessage {
    type: 'CreateGameRequest'
    props: CreateGameProps
}

export interface GameCreatedMessage extends TypedMessage {
    type: 'GameCreatedMessage'
    game: Game
}

export interface DeleteGameRequest extends TypedMessage {
    type: 'DeleteGameRequest'
    gameId: string
}

export interface GameDeletedMessage extends TypedMessage {
    type: 'GameDeletedMessage'
    gameId: string
}

export interface UpdateUserRequest extends TypedMessage {
    type: 'UpdateUserRequest'
    user: Omit<User, 'roles'>
}

export interface ConnectToGameMessage extends TypedMessage {
    type: 'ConnectToGameMessage'
    gameId: string
}

export interface GameMessage {
    id?: string
    type: string
}

export interface GameMessageResponse extends GameMessage {
    type: 'GameMessageResponse'
    response: any
}

export interface GameInfoMessage extends GameMessage {
    type: 'GameInfoMessage',
    game: Game
}

export interface NotifyGameMessage extends GameMessage {
    type: 'NotifyGameMessage',
    message: string,
    messageParams?: any
}

export interface ErorrGameMessage extends GameMessage {
    type: 'ErorrGameMessage',
    message: string,
    messageParams?: any
}

export interface StartGameMessage extends GameMessage {
    type: 'StartGameMessage'
}

export interface JoinGameMessage extends GameMessage {
    type: 'JoinGameMessage'
}

export interface AddBotGameMessage extends GameMessage {
    type: 'AddBotGameMessage'
    player: Player
}

export interface UpdateBotGameMessage extends GameMessage {
    type: 'UpdateBotGameMessage'
    player: Player
}

export interface KickPlayerMessage extends GameMessage {
    type: 'KickPlayerMessage'
    playerId: string
}

export interface GameAction {
    type: string
}

export interface GameActionMessage extends GameMessage {
    type: 'GameActionMessage',
    action: GameAction
}

export interface CrateGameBackupMessage extends GameMessage {
    type: 'CrateGameBackupMessage'
}

export interface GetAdminGameMessage extends GameMessage {
    type: 'GetAdminGameMessage'
    gameId: string
}

export interface FullGameData {
    settings: GameSettings
    game: Game
    gameState: GameState | undefined
}

export interface AdminGameMessageResponse extends GameMessage {
    type: 'AdminGameMessageResponse'
    fullGameData: FullGameData
}

export interface UpdateFullGameDataMessage extends GameMessage {
    type: 'UpdateFullGameDataMessage'
    fullGameData: FullGameData
}

export interface UpdateFullGameDataResponse extends GameMessage {
    type: 'UpdateFullGameDataResponse'
    error: string | undefined
}

