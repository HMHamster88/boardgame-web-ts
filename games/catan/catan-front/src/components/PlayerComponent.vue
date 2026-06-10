<template>
    <div style="text-align: center;">{{ t('resources') + playerPublicState?.resourceCount }}</div>
</template>

<script setup lang="ts">
import type { Player } from 'boardgame-web-common';
import type { CatanPublicGameState } from 'catan-back';
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';

let localization: any = {
    en: {
        resources: 'Resources: '
    },
    ru: {
        resources: 'Ресурсы: '
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const playerPublicState = computed(() => {
    return props.gameState.playersStates.find(pl => pl.playerId == props.player.userId)
})

const props = defineProps({
    player: {
        type: Object as PropType<Player>,
        required: true
    },
    gameState: {
        type: Object as PropType<CatanPublicGameState>,
        required: true
    }
})
</script>