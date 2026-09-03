<template>
    <o-button @click="update()">Update</o-button><br>
    Game
    <JsonEditorVue v-model="game" />
    Settings
    <JsonEditorVue v-model="settings" />
    Game State
    <JsonEditorVue v-model="gameState" />
</template>

<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue';

import { useOruga } from '@oruga-ui/oruga-next';
import { type Game, type GameSettings, type GameState } from 'boardgame-web-common';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { wsService } from '../services/wsService';

const route = useRoute()
const oruga = useOruga();

const game = ref<Game>()
const settings = ref<GameSettings>()
const gameState = ref<GameState>()

const gameId = route.params['id'] as string

async function update() {
    const error = await wsService.updateFullGameData({
        game: game.value!,
        settings: settings.value!,
        gameState: gameState.value
    })
    if (error) {
        oruga.notification.open({
            variant: 'danger',
            message: error
        })
    }
}

onMounted(async () => {
    const gameData = await wsService.getAdminGame(gameId)
    game.value = gameData.game
    settings.value = gameData.settings
    gameState.value = gameData.gameState
})
</script>