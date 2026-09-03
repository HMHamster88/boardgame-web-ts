<template>
    <div style="padding: 1rem; display: flex; gap: 0.5rem; flex-direction: column;">
        <span>{{ t('games') }}</span>
        <o-table :data="memoryLocalStore.games" :empty-label="t('noGames')">
            <o-table-column field="name" :label="t('name')" />
            <o-table-column field="created" :label="t('created')" />
            <o-table-column field="id" v-slot="{ row }" position="right">
                <o-button :label="t('go')" tag="router-link" :to="'/games/' + row.id" as="router-link"
                    style="margin-right: 0.5rem;" />
                <o-button :label="t('edit')" tag="router-link" :to="'/admin/games/' + row.id" as="router-link"
                    style="margin-right: 0.5rem;" />
                <o-button icon-left="trash-can-outline" @click="deleteGame(row)" />
            </o-table-column>
        </o-table>
    </div>
</template>

<script setup lang="ts">
import { useOruga } from '@oruga-ui/oruga-next';
import type { Game } from 'boardgame-web-common/back';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMemoryLocalStore } from '../services/localStore';
import { wsService } from '../services/wsService';

const memoryLocalStore = useMemoryLocalStore()

const oruga = useOruga();
const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            games: 'Games',
            create: 'Create',
            go: 'Go',
            edit: 'Edit',
            deleteGameTitle: 'Delete Game',
            deleteGameMessage: 'Delete game "{gameName}"?',
            noGames: 'No Games',
            created: 'Created'
        },
        ru: {
            games: 'Игры',
            create: 'Создать',
            go: 'Перейти',
            edit: 'Редактировать',
            deleteGameTitle: 'Удалить игру',
            deleteGameMessage: 'Удалить игру "{gameName}"?',
            noGames: 'Нет игр',
            created: 'Создана'
        }
    }
})
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
    }
}

async function loadGames() {
    wsService.getAllGames()
}

onMounted(async () => {
    loadGames();
})
</script>