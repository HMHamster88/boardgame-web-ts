<template>
    <div style="padding: 1rem; display: flex; gap: 0.5rem;">
        <o-dropdown>
            <template #trigger>
                <o-button icon-left="menu"></o-button>
            </template>

            <o-dropdown-item :label="t('games')" tag="router-link" to="/" />
            <o-dropdown-item v-if="isAdmin" :label="t('adminGames')" tag="router-link" to="/admin/games" />
        </o-dropdown>

        <div style="flex-grow: 1;"></div>
        <o-tag :variant="connectStatusSeverity">
            {{ connectStatusText }}
        </o-tag>
        <o-button v-if="isGameRoute" icon-right="chart-box" @click="memoryLocalStore.showStatistics = true"></o-button>
        <o-button icon-right="share-variant-outline" @click="showHideQrCode()" />
        <o-dialog v-model:active="qrCodeActive" bodyClass="qr-dialog-body-class" fullscreen>
            <qrcode-vue :value="fullUrl" class="qr-code" render-as="svg" @click="showHideQrCode()"></qrcode-vue>
        </o-dialog>
        <o-button icon-left="cog" @click="settingsDialog?.open()"></o-button>
    </div>
    <SettingsDialog ref="settingsDialog"></SettingsDialog>
</template>

<script setup lang="ts">
import { OButton, ODropdown, ODropdownItem } from '@oruga-ui/oruga-next';
import { ConnectStatus, UserRole } from 'boardgame-web-common/back';
import QrcodeVue from 'qrcode.vue';
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useLocalStore, useMemoryLocalStore } from '../services/localStore';
import SettingsDialog from './SettingsDialog.vue';

const memoryLocalStore = useMemoryLocalStore();
const localStore = useLocalStore()

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            games: 'Games',
            adminGames: 'Admin Games',
            connectStatus: {
                [ConnectStatus.CONNECTED]: 'Connected',
                [ConnectStatus.CONNECTING]: 'Connecting',
                [ConnectStatus.DISCONNECTED]: 'Disconnected',
            }
        },
        ru: {
            games: 'Игры',
            adminGames: 'Админка Игры',
            connectStatus: {
                [ConnectStatus.CONNECTED]: 'Подключено',
                [ConnectStatus.CONNECTING]: 'Подключение',
                [ConnectStatus.DISCONNECTED]: 'Отключено',
            }
        }
    }
})

const isAdmin = computed(() => localStore.user.roles.includes(UserRole.ADMIN))

const qrCodeActive = ref(false)

function showHideQrCode() {
    qrCodeActive.value = !qrCodeActive.value
}

const settingsDialog = useTemplateRef('settingsDialog')

const route = useRoute();

const isGameRoute = computed(() => route.name === 'game')

const fullUrl = computed(() => {
    return window.location.origin + route.fullPath;
});

const connectStatusText = computed(() => {
    return t('connectStatus.' + memoryLocalStore.connectStatus)
})
const connectStatusSeverity = computed(() => {
    switch (memoryLocalStore.connectStatus) {
        case ConnectStatus.CONNECTED:
            return 'success'
        case ConnectStatus.CONNECTING:
            return 'warning'
        case ConnectStatus.DISCONNECTED:
            return 'danger'
    }
})

</script>

<style>
.qr-dialog-body-class {
    height: 100%;
}

.qr-code {
    width: 100%;
    height: 100%;
}
</style>