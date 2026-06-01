<template>
    <g :transform="transform">
        <rect :fill="color" rx="5" ry="5" :width="hexSize / 6" :y="-hexSize / 2" :height="hexSize" :x="-hexSize / 12" />

        <rect v-if="isLongestRoad" fill="none" rx="5" ry="5" :width="hexSize / 6" :y="-hexSize / 2" :height="hexSize"
            :x="-hexSize / 12" filter="invert(100%)" :stroke="color" stroke-width="2px" />
        <slot></slot>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Player } from 'boardgame-web-common';
import { getEdgeAnge, pointyHexToPixel } from 'boardgame-web-common';
import { type CatanRoad } from 'catan-back';

const color = computed(() => {
    const player = props.players?.find(player => player.userId == props.data.playerId)!
    return player.color
})

const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y}) rotate(${getEdgeAnge(props.data.position)})`
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanRoad>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    },
    players: {
        type: Object as PropType<Array<Player>>,
        required: false
    },
    isLongestRoad: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits({
    click(_data: CatanRoad) {
        return true
    },
})

</script>

<style scoped></style>