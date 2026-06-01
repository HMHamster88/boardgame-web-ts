import {
    ConnectStatus,
    type GetAllGamesRequest,
    handleMessage,
    type AllGamesResponse,
    type HandshakeResponse,
    type MesasgeHandlers,
    type TypedMessage,
    type CreateGameProps,
    type CreateGameRequest,
    type User,
    type UpdateUserRequest,
    type DeleteGameRequest
} from "boardgame-web-common/back";
import { useLocalStore, useMemoryLocalStore } from "./localStore";
import {
    ArrayQueue,
    ConstantBackoff,
    Websocket,
    WebsocketBuilder,
    WebsocketEvent,
} from "websocket-ts";


class WsService {
    socket: Websocket | undefined
    gameId: string | undefined
    handshakePromise: Promise<void> | undefined

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

        type messageTypes = HandshakeResponse | AllGamesResponse
        const handlers: MesasgeHandlers<messageTypes> = {
            HandshakeResponse: async (message: HandshakeResponse) => {
                localStore.user = message.user
                memoryLocalStore.gameTypes = message.gameTypes
                handshakeResolved()
            },
            AllGamesResponse: async (message: AllGamesResponse) => {
                memoryLocalStore.games = message.games
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

    deleteGame(gameId: string) {
        this.sendMessage<DeleteGameRequest>({
            type: 'DeleteGameRequest',
            gameId: gameId
        })
    }

    getAllGames() {
        this.sendMessage<GetAllGamesRequest>({ type: 'GetAllGamesRequest' })
    }
}

export const wsService = new WsService()