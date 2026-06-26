import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'node:http';
import {
    GameStatusEnum,
    handleMessage,
    removeElement,
    type AllGamesResponse,
    type ConnectToGameMessage,
    type CreateGameRequest,
    type DeleteGameRequest,
    type Game,
    type GameCreatedMessage,
    type GameDeletedMessage,
    type GameType,
    type GetAllGamesRequest,
    type HandshakeResponse,
    type MesasgeHandlers,
    type TypedMessage,
    type UpdateUserRequest,
    type User
} from 'boardgame-web-common/back';
import { db } from './db/db.ts';
import { v4 as uuidv4 } from 'uuid';
import { getAllGameServices, loadServices } from './gameServiceSelector.ts';
import { GameSession } from './gameSession.ts';

const connections: WsConnection[] = [];

const gameSessions = new Map<string, GameSession>();

function getGameSession(gameId: string): GameSession {
    let session = gameSessions.get(gameId);
    if (session) {
        return session;
    }
    const game = db.getGame(gameId)!;
    session = new GameSession(game);
    gameSessions.set(gameId, session);
    return session;
}

export class WsConnection {
    webSocket: WebSocket;
    userId: string;
    user: User | undefined;
    game: Game | undefined;

    id() {
        return this.userId;
    }

    constructor(webSocket: WebSocket, userId: string) {
        this.webSocket = webSocket;
        this.userId = userId;
        type messageTypes =
            | GetAllGamesRequest
            | CreateGameRequest
            | UpdateUserRequest
            | ConnectToGameMessage
            | DeleteGameRequest;

        const handlers: MesasgeHandlers<messageTypes> = {
            DeleteGameRequest: async (message: DeleteGameRequest) => {
                db.deleteGameAll(message.gameId);

                connections.forEach(conn => {
                    conn.send<GameDeletedMessage>({
                        type: 'GameDeletedMessage',
                        gameId: message.gameId
                    })
                })
            },
            GetAllGamesRequest: async () => {
                this.send<AllGamesResponse>({
                    type: 'AllGamesResponse',
                    games: db.getAllGames()
                });
            },
            CreateGameRequest: async (message: CreateGameRequest) => {
                const newGame: Game = {
                    id: uuidv4(),
                    type: message.props.type,
                    owner: this.user?.id!,
                    name: message.props.name,
                    players: [],
                    status: GameStatusEnum.CREATED,
                    created: new Date()
                };
                db.addGame(newGame);
                connections.forEach(conn => {
                    conn.send<GameCreatedMessage>({
                        type: 'GameCreatedMessage',
                        game: newGame
                    })
                })
            },
            UpdateUserRequest: async (message: UpdateUserRequest) => {
                this.user = { roles: this.user?.roles!, ...message.user }
                db.updateUser(this.user);
            },
            ConnectToGameMessage: async (message: ConnectToGameMessage) => {
                const session = getGameSession(message.gameId);
                this.game = session.game
                session.addConnection(this);
            }
        };
        let actionBlocker = false
        webSocket.on('message', async (messageString: string) => {
            console.log(`Received: ${messageString} from ${this.id()}`);
            if (!actionBlocker) {
                actionBlocker = true
                const message = JSON.parse(messageString) as TypedMessage;
                await handleMessage(handlers, message);
                actionBlocker = false
            } else {
                console.log('Message blocked')
            }
        });
    }

    async init() {
        this.user = db.getUser(this.userId);
        if (!this.user) {
            this.user = await db.addUser({
                id: this.userId,
                name: 'User-' + this.userId,
                color: '#FF0000',
                roles: []
            });
        }
        const gameTypes = getAllGameServices().map((service) => {
            return {
                type: service.type,
                localizedName: service.localizedName
            } as GameType;
        });
        this.send<HandshakeResponse>({
            type: 'HandshakeResponse',
            user: this.user!,
            gameTypes: gameTypes
        });
    }

    sendString(message: string) {
        this.webSocket.send(message);
    }

    send<T extends TypedMessage>(message: T) {
        this.webSocket.send(JSON.stringify(message));
    }
}

export async function startWs(server: Server) {
    db.init();
    await loadServices();

    console.log(
        'game services loaded: ' +
        getAllGameServices()
            .map((service) => service.type)
            .join(', ')
    );

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
        const queryString = request.url?.split('?')[1];
        const params = new URLSearchParams(queryString);
        const userId = params.get('userId')!;

        const connection = new WsConnection(ws, userId);
        connection.init();
        connections.push(connection)

        console.log('Clients count: ', wss.clients.size);

        ws.on('close', () => {
            const connection = connections.find((conn) => conn.webSocket == ws);
            removeElement(connections, connection);
            console.log('Client disconnected');
        });
    });
}
