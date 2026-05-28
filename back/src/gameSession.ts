import {
    Connection,
    DataMessageListener,
    Game,
    GameActionMessage,
    GameBackService,
    GamePublicState,
    GameSettings,
    GameState,
    GameStatusEnum,
    getSubObjectChanges,
    handleMessage,
    JoinGameMessage,
    KickPlayerMessage,
    MesasgeHandlers,
    NotifyGameMessage,
    ObjectSync,
    PeerFilter,
    PlayerPrivateState,
    PropChange,
    removeElement,
    StartGameMessage,
    TypedMessage,
    UpdateUserRequest,
    watchChagesList
} from 'back-common';
import { WsConnection } from './backWs';
import { getGameSerivce } from './gameServiceSelector';
import { db } from './db/db';

export class GameSession implements Connection {
    game: Game;
    gameSync: ObjectSync<Game>;
    gameSettings: GameSettings;
    gameSettingsSync: ObjectSync<GameSettings>;
    gameState: GameState | undefined;
    gamePublicStateSync: ObjectSync<GamePublicState> | undefined;
    playerPrivateStateSync: Map<string, ObjectSync<PlayerPrivateState>> = new Map();
    connections: Map<string, WsConnection>;
    dataListeners: DataMessageListener[] = [];
    gameService: GameBackService;

    constructor(game: Game) {
        console.log('Game session started', game.id);
        this.game = game;
        this.connections = new Map<string, WsConnection>();
        this.gameSync = new ObjectSync({
            connection: this,
            id: 'game',
            value: this.game,
            retranslateChanges: true
        });
        this.gameService = getGameSerivce(game.type);
        let existingSettings = db.getGameSettings(game.id);
        if (!existingSettings) {
            existingSettings = this.gameService.getDefaultSettings();
            existingSettings.id = game.id;
            db.addGameSettings(existingSettings);
        }
        this.gameSettings = existingSettings;
        this.gameSettingsSync = new ObjectSync({
            connection: this,
            id: 'gameSettings',
            value: this.gameSettings,
            retranslateChanges: true
        });

        this.createGameStateSyncs();
    }

    sendNotify(peerId: string | undefined, message: string, messageParams: any | undefined) {
        const notifyMessage: NotifyGameMessage = {
            type: 'NotifyGameMessage',
            message: message,
            messageParams: messageParams
        };
        const stringMessage = JSON.stringify(notifyMessage);
        console.log('This', this);
        console.log('This.send', this.send);
        if (peerId) {
            this.send(peerId, stringMessage);
        } else {
            this.sendToAll(stringMessage, undefined);
        }
    }

    createGameStateSyncs() {
        if (this.game.status != GameStatusEnum.CREATED) {
            const dbGameState = db.getGameState(this.game.id);
            if (dbGameState) {
                this.gameState = dbGameState;
                this.createPublicStateSync();
                this.gamePublicStateSync?.sendUpdate(null, null);
                this.gameState.privateState?.playersStates
                    ?.map((player) => player.playerId)
                    .forEach((id) => {
                        this.createPlayerPrivateStateSync(id);
                    });
            }
        }
    }

    createPlayerPrivateStateSync(userId: string): ObjectSync<PlayerPrivateState> | null {
        if (this.playerPrivateStateSync.has(userId)) {
            return null;
        }
        const playerState = this.gameState?.privateState?.playersStates?.find(
            (st) => st.playerId == userId
        );
        if (!playerState) {
            return null;
        }
        const playerStateSync = new ObjectSync<PlayerPrivateState>({
            connection: this,
            id: 'playerPrivateState:' + userId,
            value: playerState
        });
        playerStateSync.sendUpdate(null, null);
        this.playerPrivateStateSync.set(userId, playerStateSync);
        return playerStateSync;
    }

    createPublicStateSync() {
        this.gamePublicStateSync = new ObjectSync({
            connection: this,
            id: 'gamePublicState',
            retranslateChanges: true,
            value: this.gameState?.publicState
        });
    }

    addDataMessageListener(listener: DataMessageListener): void {
        this.dataListeners.push(listener);
    }

    send(peerId: string, message: string): void {
        const connection = this.connections.get(peerId);
        if (!connection) {
            console.error('No connection with id', peerId);
            return;
        }
        connection.webSocket.send(message);
    }
    sendToAll(message: string, peerFiler: PeerFilter | undefined): void {
        let connections = this.connections.values();
        if (peerFiler) {
            connections = connections.filter((connection) => connection.user?.id);
        }
        connections.forEach((connection) => connection.webSocket.send(message));
    }

    addConnection(connection: WsConnection) {
        if (this.connections.get(connection.id())) {
            this.connections.delete(connection.id());
            console.log(`Already conected ${connection.id()} removing`);
        }
        this.connections.set(connection.id(), connection);
        console.log('Connection count', this.connections.size);
        this.gameSync.sendUpdate(undefined, connection.id());
        this.gameSettingsSync.sendUpdate(undefined, connection.id());
        if (this.gameState) {
            this.gamePublicStateSync?.sendUpdate(undefined, connection.id());
            this.playerPrivateStateSync
                ?.get(connection.id())
                ?.sendUpdate(undefined, connection.id());
        }
        const playerIndex = this.game.players.findIndex((pl) => pl.userId == connection.id());
        if (playerIndex >= 0) {
            this.game.players[playerIndex].online = true;
            this.gameSync.sendUpdateTypedPath(null, (tp) => tp.players[playerIndex].online);
        }
        connection.webSocket.on('message', (messageString: string) => {
            this.dataListeners.forEach((listener) => {
                listener(connection.id(), messageString);
            });
            const message = JSON.parse(messageString) as TypedMessage;
            type messageTypes =
                | GameActionMessage
                | JoinGameMessage
                | UpdateUserRequest
                | StartGameMessage
                | KickPlayerMessage;

            const gameChanges: PropChange[] = [];
            const gameProxy = watchChagesList(this.game, gameChanges);

            const gameSettingsChanges: PropChange[] = [];
            const gameSettingsProxy = watchChagesList(this.gameSettings, gameSettingsChanges);

            const handlers: MesasgeHandlers<messageTypes> = {
                KickPlayerMessage: async (message: KickPlayerMessage) => {
                    const player = this.game.players.find((pl) => pl.userId == message.playerId);
                    if (!player) {
                        console.debug(`No player with id "${message.playerId}"`);
                        return;
                    }
                    if (this.game.owner != connection.id() && player.userId != connection.id()) {
                        console.debug(`Kick player "${message.playerId}" not allowed`);
                        return;
                    }
                    removeElement(this.game.players, player);
                    db.updateGame(this.game);
                    this.gameSync.sendUpdate('players');
                },
                StartGameMessage: async () => {
                    if (this.gameState != undefined) {
                        return;
                    }
                    this.gameState = this.gameService.startGame(gameProxy, gameSettingsProxy);
                    db.addGameState(this.gameState);
                    this.createGameStateSyncs();
                },
                UpdateUserRequest: async (message: UpdateUserRequest) => {
                    const player = gameProxy.players.find((pl) => pl.userId == message.user.id);
                    if (!player) {
                        return;
                    }
                    player.color = message.user.color;
                    player.name = message.user.name;
                },
                JoinGameMessage: async () => {
                    const user = connection.user!;
                    if (gameProxy.players.find((pl) => pl.userId == user.id)) {
                        return;
                    }
                    gameProxy.players.push({
                        userId: user.id,
                        name: user.name,
                        color: user.color,
                        online: true
                    });
                },
                GameActionMessage: async (message: GameActionMessage) => {
                    console.log(`Game action ${message.action.type} connection ${connection.id()}`);
                    this.gameSync.updateSended = false;
                    this.gameSettingsSync.updateSended = false;
                    if (this.gamePublicStateSync) {
                        this.gamePublicStateSync.updateSended = false;
                    }
                    this.playerPrivateStateSync.forEach((sync) => (sync.updateSended = false));

                    const gameStateChanges: PropChange[] = [];

                    const gameStateProxy = this.gameState
                        ? watchChagesList(this.gameState, gameStateChanges)
                        : undefined;

                    await this.gameService.performAction(
                        {
                            game: this.game,
                            gameSync: this.gameSync,
                            gameState: gameStateProxy,
                            gamePublicStateSync: this.gamePublicStateSync,
                            gameSettings: gameSettingsProxy,
                            gameSettingsSync: this.gameSettingsSync,
                            playerPrivateStateSync: this.playerPrivateStateSync,
                            sendNotify: (
                                peerId: string | undefined,
                                message: string,
                                messageParams: any | undefined
                            ) => this.sendNotify(peerId, message, messageParams)
                        },
                        message.action,
                        connection.id()
                    );

                    if (this.gameState) {
                        const publicStateChanges = getSubObjectChanges(gameStateChanges, [
                            'publicState'
                        ]);

                        if (this.gamePublicStateSync) {
                            this.gamePublicStateSync.sendPropChanges(publicStateChanges);
                        }

                        const privatePlayerStatesChanges = getSubObjectChanges(gameStateChanges, [
                            'privateState',
                            'playersStates'
                        ]);
                        const playerChangesMap = new Map<number, PropChange[]>();

                        for (const change of privatePlayerStatesChanges) {
                            const playerIndex = Number(change.path[0]);
                            let playerChanges = playerChangesMap.get(playerIndex);
                            if (!playerChanges) {
                                playerChanges = [];
                                playerChangesMap.set(playerIndex, playerChanges);
                            }
                            const playerChange: PropChange = {
                                path: change.path.slice(1),
                                value: change.value
                            };
                            playerChanges.push(playerChange);
                        }

                        playerChangesMap.forEach((change, playerIndex) => {
                            const playerId =
                                this.gameState?.privateState?.playersStates![playerIndex]
                                    ?.playerId!;
                            const playerSync = this.playerPrivateStateSync.get(playerId);
                            playerSync?.sendPropChanges(change);
                        });

                        if (this.gameState) {
                            const playersUpdated = !Array.from(
                                this.playerPrivateStateSync.values()
                            ).find((sync) => sync.updateSended);
                            if (
                                playersUpdated ||
                                (this.gamePublicStateSync && this.gamePublicStateSync.updateSended)
                            ) {
                                db.updateGameState(this.gameState);
                            }
                        }
                    }
                }
            };

            handleMessage(handlers, message);

            this.gameSync.sendPropChanges(gameChanges);
            this.gameSettingsSync.sendPropChanges(gameSettingsChanges);

            if (this.gameSync.updateSended || gameChanges.length > 0) {
                db.updateGame(this.game);
            }

            if (this.gameSettingsSync.updateSended || gameSettingsChanges.length > 0) {
                db.updateGameSettings(this.gameSettings);
            }
        });
        connection.webSocket.on('close', () => {
            this.connections.delete(connection.id());
            const playerIndex = this.game.players.findIndex(
                (player) => player.userId == connection.id()
            );
            console.log('Player index', playerIndex);
            if (playerIndex >= 0) {
                this.game.players[playerIndex].online = false;
                this.gameSync.sendUpdateTypedPath(null, (tp) => tp.players[playerIndex].online);
            }
        });
    }
}
