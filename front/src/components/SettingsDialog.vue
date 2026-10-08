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
            <o-field>
                <o-switch :label="t('vibration')" v-model="settingsCopy.vibration" />
            </o-field>
            <div v-if="playerGameSettingsCopy">
                    <h3 v-if="memoryLocalStore.gameService">{{ localizedGameName }}</h3>
                    <component :is="memoryLocalStore.gameService?.playerSettingsComponent" :settings="playerGameSettingsCopy"></component>
            </div>
            <o-button @click="createBackup" v-if="gameId && localStore.user.roles.includes(UserRole.ADMIN)">{{ t('createGameStateBackup') }}</o-button>
        </template>
        <template #footer>
            <o-button :label="$t('cancel')" @click="close(false)" />
            <o-button :label="$t('ok')" @click="close(true)" />
        </template>
    </o-dialog>
</template>

<script setup lang="ts">
import { OButton, OField, OInput, OSelect, OSwitch } from '@oruga-ui/oruga-next';
import { UserRole, type User } from 'boardgame-web-common';
import type { PlayerGameSettings } from 'boardgame-web-common/front'
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { type Settings, useLocalStore, useMemoryLocalStore } from '../services/localStore';
import { wsService } from '../services/wsService';

const localStore = useLocalStore();
const memoryLocalStore = useMemoryLocalStore()

const playerGameSettings = computed(() => {
    const service = memoryLocalStore.gameService
    if (!service) {
        return undefined
    }
    return localStore.playerGameSettings[service.type]
})

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
            vibration: 'Vibration',
            createGameStateBackup: 'Create Game State Backup'
        },
        ru: {

            defaultPlayerName: 'Имя игрока по умолчанию',
            defaultPlayerColor: 'Цвет игрока по умолчанию',
            language: 'Язык',
            soundVolume: 'Громкость звуков',
            vibration: 'Вибрация',
            createGameStateBackup: 'Создать Бэкап Состояния Игры'
        }
    }
})

const t = i18n.t

const localizedGameName = computed(() => {
    const service = memoryLocalStore.gameService
    if (!service) {
        return undefined
    }
    return service.localization[i18n.locale.value][service.type]
})

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

const userCopy = ref<User>({ id: '', color: '', name: '', roles: [] })
const settingsCopy = ref<Settings>({ locale: 'en', soundsVolume: 0.5, vibration: true })
const playerGameSettingsCopy = ref<PlayerGameSettings>()

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
    userCopy.value = Object.assign({}, localStore.user)
    settingsCopy.value = Object.assign({}, localStore.settings)
    playerGameSettingsCopy.value = Object.assign({}, playerGameSettings.value)
    showDialog.value = true;
}

function close(save: boolean) {
    if (save) {
        localStore.user = userCopy.value!
        localStore.settings = settingsCopy.value!
        wsService.updateUser(localStore.user)
        if (memoryLocalStore.gameService && playerGameSettingsCopy.value) {
            localStore.playerGameSettings[memoryLocalStore.gameService.type] = playerGameSettingsCopy.value
        } 
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>