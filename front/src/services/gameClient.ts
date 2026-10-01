import {
    type ErorrGameMessage,
    type GameAction,
    type GameActionMessage,
    type GameMessage,
    type JoinGameMessage,
    type KickPlayerMessage,
    type NotifyGameMessage,
    type StartGameMessage,
    type GamePublicState,
    type PlayerPrivateState,
    type Game,
    ObjectSync,
    type Connection,
    type DataMessageListener,
    type PeerFilter,
    type ConnectToGameMessage,
    type GameSettings,
    type AddBotGameMessage,
    type Player,
    type UpdateBotGameMessage,
    type GameMessageResponse
} from "boardgame-web-common/back";

import { wsService } from "./wsService.ts";
import { Websocket, WebsocketEvent } from "websocket-ts";
import { v4 as uuidv4 } from 'uuid';

type ResponseResolve = (response: any) => void

export default class GameClient {
    private gameId: string;
    private userId: string;
    gameObjectSync: ObjectSync<Game>
    gameSettingsSync: ObjectSync<GameSettings>
    gamePublicStateSync: ObjectSync<GamePublicState>
    playerPrivateStateSync: ObjectSync<PlayerPrivateState>
    connection!: Connection
    responseResole: Map<string, ResponseResolve> = new Map()

    JoinGameMessage: (message: JoinGameMessage) => void = () => { }
    ErorrGameMessage: (message: ErorrGameMessage) => void = () => { }
    NotifyGameMessage: (messge: NotifyGameMessage) => void = () => { }
    GameMessageResponse: (message: GameMessageResponse) => void = (message: GameMessageResponse) => {
        if (message.id) {
            const resolve = this.responseResole.get(message.id)
            if (resolve) {
                this.responseResole.delete(message.id)
                resolve(message.response)
            }
        }
    }

    async start() {
        wsService.sendMessage<ConnectToGameMessage>({
            type: 'ConnectToGameMessage',
            gameId: this.gameId
        })
    }

    constructor(gameId: string, userId: string) {
        this.gameId = gameId
        this.userId = userId
        this.connection = {
            addDataMessageListener(listener: DataMessageListener) {
                wsService.socket?.addEventListener(WebsocketEvent.message, (_: Websocket, ev: MessageEvent) => {
                    listener(userId, ev.data)
                })
            },
            send(_peerId: string, message: string): void {
                wsService.socket?.send(message)
            },
            sendToAll(message: string, _peerFiler: PeerFilter | undefined): void {
                wsService.socket?.send(message)
            }
        }
        this.gameObjectSync = new ObjectSync<Game>({ connection: this.connection, id: 'game' })
        this.gameSettingsSync = new ObjectSync<GameSettings>({ connection: this.connection, id: 'gameSettings' })
        this.gamePublicStateSync = new ObjectSync<GamePublicState>({ connection: this.connection, id: 'gamePublicState' })
        this.playerPrivateStateSync = new ObjectSync<PlayerPrivateState>({ connection: this.connection, id: 'playerPrivateState:' + userId })

        this.connection.addDataMessageListener((_peerId, message) => {
            const gameMessage = JSON.parse(message) as GameMessage
            const event = (this as any)[gameMessage.type]
            if (event) {
                event(gameMessage)
            }
        })

        wsService.socket?.addEventListener(WebsocketEvent.reconnect, () => {
            wsService.sendMessage<ConnectToGameMessage>({
                type: 'ConnectToGameMessage',
                gameId: this.gameId
            })
        })
    }

    async sendMessageWithResponse<M extends GameMessage, R>(message: M): Promise<R> {
        return new Promise(resolve => {
            const messageId = uuidv4()
            this.responseResole.set(messageId, (response: any) => {
                resolve(response)
            })
            message.id = messageId
            this.send(message)
        })
    }

    send<T extends GameMessage>(message: T) {
        this.connection.send(this.gameId, JSON.stringify(message))
    }

    join() {
        this.send<JoinGameMessage>({
            type: 'JoinGameMessage'
        })
    }

    addBot(player: Player) {
        this.send<AddBotGameMessage>({
            type: 'AddBotGameMessage',
            player: player
        })
    }

    updateBot(player: Player) {
        this.send<UpdateBotGameMessage>({
            type: 'UpdateBotGameMessage',
            player: player
        })
    }

    kickPlayer(playerId: string) {
        this.send<KickPlayerMessage>({
            type: 'KickPlayerMessage',
            playerId: playerId
        })
    }

    performGameAction(action: GameAction) {
        this.send<GameActionMessage>({
            type: 'GameActionMessage',
            action: action
        })
    }

    performGameActionWithResponse<M extends GameAction>(action: M): Promise<any> {
        return this.sendMessageWithResponse<GameActionMessage, any>({
            type: 'GameActionMessage',
            action: action
        })
    }

    startGame() {
        this.send<StartGameMessage>({ type: 'StartGameMessage' })
    }

    updatePlayer(name: string, color: string) {
        const player = this.gameObjectSync.value?.players.find(player => player.userId == this.userId)
        if (player) {
            player.name = name
            player.color = color
            const playerIndex = this.gameObjectSync.value?.players.indexOf(player)
            this.gameObjectSync.sendUpdate(`players[${playerIndex}]`)
        }
    }
}