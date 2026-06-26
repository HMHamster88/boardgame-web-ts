<template>
    <o-dialog v-model:active="showDialog" modal :title="t('settings')" :style="{ width: '35rem' }">
        <template #content>
            <o-field :label="t('language')">
                <o-select id="language" v-model="language" :options="languages" />
            </o-field>
            <o-field :label="t('defaultPlayerName')">
                <o-input id="name" v-model="userCopy.name" />
            </o-field>
            <o-field :label="t('defaultPlayerColor')">
                <input type="color" v-model="userColor" />
            </o-field>
            <o-field :label="t('soundVolume')">
                <o-slider :min="0" :max="1" :step="0.01" v-model="settingsCopy.soundsVolume"></o-slider>
            </o-field>
            <o-button @click="createBackup" v-if="gameId">{{ t('createGameStateBackup') }}</o-button>
        </template>
        <template #footer>
            <o-button :label="$t('cancel')" @click="close(false)" />
            <o-button :label="$t('ok')" @click="close(true)" />
        </template>
    </o-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Settings, useLocalStore } from '../services/localStore'
import { useI18n } from 'vue-i18n'
import _ from 'lodash';
import type { User } from 'boardgame-web-common';
import { wsService } from '../services/wsService';
import { useRoute } from 'vue-router';

const route = useRoute()
const gameId = computed(() => route.params['id'] as string)

const showDialog = ref(false)

const i18n = useI18n({
    locale: 'en',
    messages: {
        en: {
            defaultPlayerName: 'Default Player Name',
            defaultPlayerColor: 'Default Player Color',
            language: 'Language',
            soundVolume: 'Sound Volume',
            createGameStateBackup: 'Create Game State Backup'
        },
        ru: {

            defaultPlayerName: 'Имя игрока по умолчанию',
            defaultPlayerColor: 'Цвет игрока по умолчанию',
            language: 'Язык',
            soundVolume: 'Громкость звуков',
            createGameStateBackup: 'Создать Бэкап Состояния Игры'
        }
    }
})

const t = i18n.t

interface Language {
    label: string
    value: string
}

const languages = ref<Language[]>([
    {
        label: 'English',
        value: 'en'
    },
    {
        label: 'Русский',
        value: 'ru'
    }
])

const language = computed<string>({
    get: () => {
        return i18n.locale.value
    },
    set: (newVal: string) => {
        i18n.locale.value = newVal as any
        settingsCopy.value.locale = newVal
    }
})

const localStore = useLocalStore();

const userCopy = ref<User>({ id: '', color: '', name: '', roles: [] })
const settingsCopy = ref<Settings>({ locale: 'en', soundsVolume: 0.5 })

const userColor = computed({
    get: () => {
        return userCopy.value.color
    },
    set: (newValue) => {
        if (newValue.startsWith('#')) {
            userCopy.value.color = newValue
        } else {
            userCopy.value.color = '#' + newValue
        }
    }
})

async function createBackup() {
    wsService.createGameBackup()
}

function open() {
    userCopy.value = _.cloneDeep(localStore.user)
    settingsCopy.value = _.cloneDeep(localStore.settings)
    showDialog.value = true;
}

function close(save: boolean) {
    if (save) {
        localStore.user = userCopy.value!
        localStore.settings = settingsCopy.value!
        wsService.updateUser(localStore.user)
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>