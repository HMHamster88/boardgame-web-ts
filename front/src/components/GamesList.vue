<template>
    <div style="padding: 1rem; display: flex; gap: 0.5rem; flex-direction: column;">
        <span>{{ t('games') }}</span>
        <o-table :data="memoryLocalStore.games" :empty-label="t('noGames')">
            <o-table-column field="name" :label="t('name')" />
            <o-table-column field="created" :label="t('created')" />
            <o-table-column field="id" v-slot="{ row }" position="right">
                <o-button :label="t('go')" tag="router-link" :to="'/games/' + row.id" as="router-link"
                    style="margin-right: 0.5rem;" />
                <o-button icon-left="trash-can-outline" @click="deleteGame(row)" />
            </o-table-column>
        </o-table>
        <div class="flex items-center gap-2">
            <o-button @click="createGame">{{ t('create') }}</o-button>
        </div>
    </div>
    <CreateGameDialog ref="createGameDialog"></CreateGameDialog>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

import CreateGameDialog from '../components/CreateGameDialog.vue'
import { useMemoryLocalStore } from '../services/localStore'
import { useI18n } from 'vue-i18n'
import type { Game } from 'boardgame-web-common/back'
import { wsService } from '../services/wsService'
import { useOruga } from '@oruga-ui/oruga-next'

const oruga = useOruga();

const memoryLocalStore = useMemoryLocalStore()

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            games: 'Games',
            create: 'Create',
            go: 'Go',
            deleteGameTitle: 'Delete Game',
            deleteGameMessage: 'Delete game "{gameName}"?',
            noGames: 'No Games',
            created: 'Created'
        },
        ru: {
            games: 'Игры',
            create: 'Создать',
            go: 'Перейти',
            deleteGameTitle: 'Удалить игру',
            deleteGameMessage: 'Удалить игру "{gameName}"?',
            noGames: 'Нет игр',
            created: 'Создана'
        }
    }
})

const createGameDialog = useTemplateRef('createGameDialog')

async function loadGames() {
    wsService.getAllGames()
}

async function createGame() {
    if (createGameDialog.value) {
        const createGameProps = await createGameDialog.value.open()
        wsService.createGame(createGameProps)
        loadGames();
    }
}

async function deleteGame(game: Game) {
    const result = await oruga.dialog.open({
        title: t('deleteGameTitle'),
        content: t('deleteGameMessage', { gameName: game.name }),
        confirmButton: t('ok'),
        confirmVariant: "success",
        cancelButton: t('cancel'),
        buttonPosition: "right",
        closeOnConfirm: true
    }).promise
    if (result[1] == 'confirm') {
        wsService.deleteGame(game.id)
        loadGames()
    }
}

onMounted(async () => {
    loadGames();
})

</script>
