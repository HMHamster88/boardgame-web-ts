<template>
    <div style="padding: 1rem; display: flex; gap: 0.5rem;">
        <o-button :label="t('games')" tag="router-link" to="/" as="router-link" />
        <div style="flex-grow: 1;"></div>
        <o-tag :variant="connectStatusSeverity">
            {{ connectStatusText }}
        </o-tag>
        <o-dropdown :keep-open="true" mobile-modal desktop-modal>
            <template #trigger>
                <o-button icon-right="share-variant-outline" />
            </template>
            <vue-qrcode :value="fullUrl" :options="{ width: 200 }"></vue-qrcode>
        </o-dropdown>
        <o-button icon-left="cog" @click="settingsDialog?.open()"></o-button>
    </div>
    <SettingsDialog ref="settingsDialog"></SettingsDialog>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, useTemplateRef } from "vue";
import { useI18n } from 'vue-i18n';
import { useMemoryLocalStore } from '../services/localStore';
import { ConnectStatus } from 'back-common';
import SettingsDialog from './SettingsDialog.vue';

const memoryLocalStore = useMemoryLocalStore();

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            games: 'Games',
            connectStatus: {
                [ConnectStatus.CONNECTED]: 'Connected',
                [ConnectStatus.CONNECTING]: 'Connecting',
                [ConnectStatus.DISCONNECTED]: 'Disconnected',
            }
        },
        ru: {
            games: 'Игры',
            connectStatus: {
                [ConnectStatus.CONNECTED]: 'Подключено',
                [ConnectStatus.CONNECTING]: 'Подключение',
                [ConnectStatus.DISCONNECTED]: 'Отключено',
            }
        }
    }
})

const settingsDialog = useTemplateRef('settingsDialog')

const route = useRoute();
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