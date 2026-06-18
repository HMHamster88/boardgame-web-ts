<template>
    <div class="flex justify-center">
        <o-icon v-if="status == 'active'" icon="account"></o-icon>
        <o-icon v-if="status == 'thinking'" spin icon="timer-sand-empty"></o-icon>
        <o-icon v-if="status == 'checked'" icon="check"></o-icon>
    </div>
</template>
<script setup lang="ts">
import { OIcon } from '@oruga-ui/oruga-next';

import type { Player } from 'boardgame-web-common';
import type { CahGamePublicState } from 'cah-back';
import { computed, type PropType } from 'vue';

const status = computed(() => {
    if (isActivePlayer.value) {
        return 'active'
    }
    if (playerAnswer.value) {
        return 'checked'
    }
    return 'thinking'
})

const playerAnswer = computed(() => {
    return props.gameState.playersSlectedAswers.find(answer => answer.playerId == props.player.userId)
})

const isActivePlayer = computed(() => {
    const activePlayer = props.gameState.playersStates[props.gameState.activePlayerIndex]
    return activePlayer.playerId == props.player.userId
})

const props = defineProps({
    player: {
        type: Object as PropType<Player>,
        required: true
    },
    gameState: {
        type: Object as PropType<CahGamePublicState>,
        required: true
    }
})
</script>