import type { TypedMessage } from "./messageHandler.js"
import type { Game, User, CreateGameProps, GameSettings, GameType } from "./dto.js"

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

export interface DeleteGameRequest extends TypedMessage {
    type: 'DeleteGameRequest'
    gameId: string
}

export interface UpdateUserRequest extends TypedMessage {
    type: 'UpdateUserRequest'
    user: User
}

export interface ConnectToGameMessage extends TypedMessage {
    type: 'ConnectToGameMessage'
    gameId: string
}

export interface GameMessage {
    type: string;
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

