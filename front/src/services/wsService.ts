import {
    type AdminGameMessageResponse,
    type AllGamesResponse,
    ConnectStatus,
    type CrateGameBackupMessage,
    type CreateGameProps,
    type CreateGameRequest,
    type DeleteGameRequest,
    type FullGameData,
    type GameCreatedMessage,
    type GameDeletedMessage,
    type GameMessage,
    type GetAdminGameMessage,
    type GetAllGamesRequest,
    type HandshakeResponse,
    type MesasgeHandlers,
    type TypedMessage,
    type UpdateFullGameDataMessage,
    type UpdateFullGameDataResponse,
    type UpdateUserRequest,
    type User,
    findAndRemoveElement,
    handleMessage
} from "boardgame-web-common/back";
import { v4 as uuidv4 } from 'uuid';
import {
    ArrayQueue,
    ConstantBackoff,
    Websocket,
    WebsocketBuilder,
    WebsocketEvent,
} from "websocket-ts";
import { useLocalStore, useMemoryLocalStore } from "./localStore";


class WsService {
    socket: Websocket | undefined
    gameId: string | undefined
    handshakePromise: Promise<void> | undefined
    adminGamePromiseResolve: ((gameData: FullGameData) => void) | undefined

    start() {

        const localStore = useLocalStore()
        const memoryLocalStore = useMemoryLocalStore()
        memoryLocalStore.connectStatus = ConnectStatus.CONNECTING
        this.socket = new WebsocketBuilder('/ws?userId=' + localStore.user.id)
            .withBuffer(new ArrayQueue())
            .withBackoff(new ConstantBackoff(1000))
            .build()


        this.socket.addEventListener(WebsocketEvent.open, () => {
            console.log("Ws Opened")
            memoryLocalStore.connectStatus = ConnectStatus.CONNECTED
        });

        this.socket.addEventListener(WebsocketEvent.close, () => {
            memoryLocalStore.connectStatus = ConnectStatus.DISCONNECTED
            console.log("Ws Closed")
        });
        this.socket.addEventListener(WebsocketEvent.reconnect, () => {
            console.log("Ws Reconnected")
            memoryLocalStore.connectStatus = ConnectStatus.CONNECTED
        })
        this.socket.addEventListener(WebsocketEvent.retry, () => {
            console.log("Retry..")
            memoryLocalStore.connectStatus = ConnectStatus.CONNECTING
        })

        let handshakeResolved = () => { }

        this.handshakePromise = new Promise((resolve) => {
            handshakeResolved = resolve
        })

        type messageTypes = HandshakeResponse | AllGamesResponse | GameCreatedMessage | GameDeletedMessage | AdminGameMessageResponse
        const handlers: MesasgeHandlers<messageTypes> = {
            HandshakeResponse: async (message: HandshakeResponse) => {
                localStore.user = message.user
                memoryLocalStore.gameTypes = message.gameTypes
                handshakeResolved()
            },
            AllGamesResponse: async (message: AllGamesResponse) => {
                memoryLocalStore.games = message.games
            },
            GameCreatedMessage: async (message: GameCreatedMessage) => {
                memoryLocalStore.games.push(message.game)
            },
            GameDeletedMessage: async (message: GameDeletedMessage) => {
                findAndRemoveElement(memoryLocalStore.games, game => game.id == message.gameId)
            },
            AdminGameMessageResponse: async (message: AdminGameMessageResponse) => {
                if (this.adminGamePromiseResolve) {
                    this.adminGamePromiseResolve(message.fullGameData)
                    this.adminGamePromiseResolve = undefined
                }
            }
        }

        this.socket.addEventListener(WebsocketEvent.message, (_: Websocket, ev: MessageEvent) => {
            const stringData = ev.data as string
            const message = JSON.parse(stringData) as TypedMessage
            console.log('Received message', message);
            handleMessage(handlers, message)
        });
    }

    sendMessage<T extends TypedMessage>(message: T) {
        console.log('Send message', message.type)
        this.socket?.send(JSON.stringify(message))
    }

    async sendMessageWithResponse<M extends GameMessage, R extends GameMessage>(message: M): Promise<R> {
        return new Promise(resolve => {
            const messageId = uuidv4()
            const listener = (_: Websocket, ev: MessageEvent) => {
                const stringData = ev.data as string
                const message = JSON.parse(stringData) as GameMessage
                if (message.id) {
                    this.socket?.removeEventListener(WebsocketEvent.message, listener)
                    resolve(message as R)
                }
            }
            this.socket?.addEventListener(WebsocketEvent.message, listener)
            message.id = messageId
            this.sendMessage(message)
        })
    }

    updateUser(user: User) {
        this.sendMessage<UpdateUserRequest>({
            type: 'UpdateUserRequest',
            user: user
        })
    }

    createGame(props: CreateGameProps) {
        this.sendMessage<CreateGameRequest>({
            type: 'CreateGameRequest',
            props: props
        })
    }

    createGameBackup() {
        this.sendMessage<CrateGameBackupMessage>({
            type: 'CrateGameBackupMessage'
        })
    }

    deleteGame(gameId: string) {
        this.sendMessage<DeleteGameRequest>({
            type: 'DeleteGameRequest',
            gameId: gameId
        })
    }

    getAllGames() {
        this.sendMessage<GetAllGamesRequest>({ type: 'GetAllGamesRequest' })
    }

    async getAdminGame(gameId: string): Promise<FullGameData> {
        return (await this.sendMessageWithResponse<GetAdminGameMessage, AdminGameMessageResponse>({ type: 'GetAdminGameMessage', gameId: gameId })).fullGameData
    }

    async updateFullGameData(gameData: FullGameData): Promise<string | undefined> {
        return (await this.sendMessageWithResponse<UpdateFullGameDataMessage, UpdateFullGameDataResponse>(
            { type: 'UpdateFullGameDataMessage', fullGameData: gameData })).error
    }
}

export const wsService = new WsService()