<template>
    <div v-if="game.players" header="Players" class="card">
        <div class="flex items-center">
            <div class="players-container">
                <o-tag v-for="player, index in game.players" :closeable="canKickPlayer(player)"
                    @close="kickPlayer(player)" :class="playerClassStyle(player)" v-on:click="playerClick(player)">
                    <div>
                        <div class="flex items-center">
                            <div class="rounded-box" :style="playerColorStyle(player)"></div>
                            <div class="ml-1 mr-1">{{ player.name }}</div>
                            <div :class="{ 'bg-red': !player.online, 'bg-green-yellow': player.online, circle: true }">
                            </div>
                            <br>
                        </div>
                        <div v-if="playersPoints && playersPoints[index] != null" style="text-align: center;">
                            {{ t('playerPoints', { points: playersPoints[index] }) }}</div>
                        <component :is="playerComponent" :player="player" :gameState="gameState"
                            :gameSettings="gameSettings">

                        </component>
                    </div>

                </o-tag>
            </div>
            <div class="mr-auto"></div>
            <o-button v-on:click="join" v-if="canJoin">{{ t('join') }}</o-button>
        </div>
    </div>

    <div v-if="showGameSetting" name="settings" class="card flex-col">
        <h2>{{ t('gameSettings') }}</h2>
        <component :is="settingsComponent" class="tab" :settings="gameSettings" @performAction="peformGameAction"
            :canEdit="isGameOwner">
        </component>
        <o-button @click="startGame" :disabled="!canStartGame">{{ t('startGame') }}</o-button>
    </div>

    <div v-if="showGameView && game.status == GameStatusEnum.FINISHED" class="card flex-col">
        <h2>{{ t('gameFinished') }}</h2>
        <p>{{ t('winners') }}</p>
        <span v-for="player in winners">{{ player.name }}</span>
        <div v-if="gameState?.statistics">
            <h4>{{ t('statistics') }}</h4>
            <component :is="statisticsComponent" :statistics="gameState?.statistics">
            </component>
        </div>
    </div>

    <div v-if="showGameView" class="card flex-col">
        <component v-if="gameState" :is="gameViewComponent" :gameSettings="gameSettings" :game="game"
            :gameState="gameState" :playerPrivateState="playerPrivateState" :localPlayerIndex="localPlayerIndex"
            ref="gameView" @performAction="peformGameAction">

        </component>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { useRoute } from 'vue-router';

import { GameStatusEnum, type Game, type GamePublicState, type PlayerPrivateState, type Player, type GameAction, type GameSettings, createDeepProxy } from 'boardgame-web-common/back';
import { useLocalStore } from '../services/localStore';

import { merge } from 'lodash';
import { useI18n } from 'vue-i18n';
import { soundService } from '../services/soundService.ts';
import GameClient from '../services/gameClient.ts';
import type { GameFrontService } from 'boardgame-web-common/front';
import { getGameService } from '../services/gameFrontServiceSelector.ts';
import { useOruga } from '@oruga-ui/oruga-next';

const oruga = useOruga();

const { messages, t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            statistics: 'Statistics',
            playerPoints: 'Points: {points}',
            connecting: 'Connecting...',
            connected: 'Connected',
            disconnected: 'Disconnected',
            join: 'Join',
            gameSettings: 'Game Settings',
            startGame: 'Start Game',
            winners: 'Winners:',
            yourTurn: 'Your turn'
        },
        ru: {
            statistics: 'Статистика',
            playerPoints: 'Очки: {points}',
            connecting: 'Подключение...',
            connected: 'Подключено',
            disconnected: 'Отключено',
            join: 'Присоединиться',
            gameSettings: 'Настройки Игры',
            startGame: 'Начать игру',
            winners: 'Победители:',
            yourTurn: 'Ваш ход'
        }
    }
})

const route = useRoute()
const localStore = useLocalStore();

const gameId = route.params['id'] as string

const game = ref<Game>({ id: '', name: '', owner: '', players: [], status: GameStatusEnum.CREATED, type: '', settings: { minPlayers: 2, maxPlayers: 2 }, created: new Date() } as Game)
const gameState = ref<GamePublicState | undefined>(undefined)
const gameSettings = ref<GameSettings>({ id: '' })

const gameClient = new GameClient(gameId, localStore.user.id)
const gameService = ref<GameFrontService>()

const playerPrivateState = ref<PlayerPrivateState>({
    playerId: localStore.user.id
})

const playersPoints = computed(() => {
    if (!gameState.value) {
        return
    }
    return game.value.players.map(player => {
        return gameState.value?.playersStates?.find(pl => pl.playerId == player.userId)?.points
    })
})



function playerClassStyle(player: Player) {
    return {
        "player": true,
        "active-player": player == activePlayer.value
    }
}

const playerComponent = computed(() => {
    if (!gameState.value || !gameService.value) {
        return null
    }
    return gameService.value.playerComponent
})

const statisticsComponent = computed(() => {
    if (!gameState.value || !gameService.value) {
        return null
    }
    return gameService.value.statisticsComponent
})

const gameViewComponent = computed(() => {
    if (!gameState.value || !gameService.value) {
        return null
    }
    return gameService.value.gameViewComponent
})

const showGameView = computed(() => {
    return game.value.type && game.value.status == GameStatusEnum.STARTED || game.value.status == GameStatusEnum.FINISHED
})

const winners = computed(() => {
    if (!gameState.value) {
        return []
    }
    return game.value.players.filter(player => gameState.value?.winnersIds.includes(player.userId))
})

const settingsComponent = computed(() => {
    if (!game.value.type || !gameService.value) {
        return null
    }
    return gameService.value.settingsComponent
})

const localPlayerIndex = computed(() => {
    return game.value.players.indexOf(localPlayer.value!)
})

const activePlayer = computed(() => {
    if (gameState.value?.activePlayerIndex == null) {
        return null
    }
    return game.value.players[gameState.value.activePlayerIndex]
})

watch(activePlayer, (newValue) => {
    if (!newValue) {
        return
    }
    if (newValue.userId == localPlayer.value?.userId && game.value.status == GameStatusEnum.STARTED) {
        oruga.notification.open({
            duration: 1000,
            message: t('yourTurn')
        });
        soundService.notification()
    }
})

const canJoin = computed(() => {
    return gameService.value && game.value.players.length < gameService.value.gameStaticSettings.maxPlayers && !localPlayer.value && game.value.status == GameStatusEnum.CREATED
})

const isGameOwner = computed(() => {
    return game.value.owner == localStore.user.id
})

const canStartGame = computed(() => {
    const playerCount = game.value.players.length
    const staticSettings = gameService.value?.gameStaticSettings
    return isGameOwner.value && staticSettings && playerCount >= staticSettings.minPlayers && playerCount <= staticSettings.maxPlayers
})

const showGameSetting = computed(() => {
    return game.value.type && game.value.status == GameStatusEnum.CREATED
})

function playerColorStyle(player: Player) {
    return {
        'background-color': player.color
    }
}

function peformGameAction(message: GameAction) {
    gameClient.performGameAction(message)
}

function startGame() {
    gameClient.startGame()
}

function canKickPlayer(player: Player): boolean {
    return (player.userId == localStore.user.id || game.value.owner == localStore.user.id) && game.value.status == GameStatusEnum.CREATED
}

async function kickPlayer(player: Player) {
    const result = await oruga.dialog.open({
        title: t('kickPlayer'),
        content: t('kickPlayerQuestion', { player: player.name }),
        confirmButton: t('ok'),
        confirmVariant: "success",
        cancelButton: t('cancel'),
        buttonPosition: "right",
        closeOnConfirm: true
    }).promise
    if (result[1] == 'confirm') {
        gameClient.kickPlayer(player.userId)
    }
}


const localPlayer = computed(() => {
    return game.value.players.find(player => player.userId == localStore.user.id)
})


function join() {
    gameClient.join();
}

function translateMessageParams(messageParams: any) {
    if (messageParams == undefined) {
        return undefined
    }
    const result: any = {}
    Object.keys(messageParams).forEach((key) => {
        if (key.startsWith('t_')) {
            result[key.slice(2)] = t(messageParams[key])
        } else {
            result[key] = messageParams[key]
        }
    })
    return result
}

onMounted(async () => {

    gameClient.ErorrGameMessage = (message) => {
        oruga.notification.open({
            variant: 'danger',
            message: t(message.message, message.messageParams)
        })
    }

    gameClient.NotifyGameMessage = (message) => {
        oruga.notification.open({
            duration: 3000,
            message: t(message.message, translateMessageParams(message.messageParams))
        });
        soundService.notification()
    }

    gameClient.gameObjectSync.valueSetter = (value) => {
        game.value = value
        getGameService(game.value.type).then(loadedGameService => {
            gameService.value = loadedGameService
            merge(messages.value, gameService.value.localization)
        })
        return game.value
    }

    gameClient.gameSettingsSync.valueSetter = (value) => {
        const gameSettingsProxy = createDeepProxy(value, (change) => {
            if (!gameClient.gameSettingsSync.changingByUpdate) {
                gameClient.gameSettingsSync.sendPropChanges([change])
            }
        })
        gameSettings.value = gameSettingsProxy
        return gameSettings.value
    }

    gameClient.gamePublicStateSync.valueSetter = (value) => {
        gameState.value = value
        return gameState.value
    }

    gameClient.playerPrivateStateSync.valueSetter = (value) => {
        playerPrivateState.value = value
        return playerPrivateState.value
    }

    await gameClient.start()
})

function playerClick(player: Player) {
    player.online = !player.online
}

</script>

<style scoped>
.players-container {
    gap: 1rem;
}

.active-player {
    border: solid;
    border-color: rgb(0, 123, 255);
}

.player {
    border-radius: 8px;
    margin: 0.2rem;
    min-height: 3rem;
}
</style>