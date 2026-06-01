<template>
    <g :transform="transform">
        <g v-for="obj in data.intersectionObjects">
            <Settlement v-if="obj.type == CatanIntersectionObjectType.SETTLEMENT" :color="getPlayerColor(obj)"
                :size="size" :centered="true">
            </Settlement>
            <City v-else-if="obj.type == CatanIntersectionObjectType.CITY" :color="getPlayerColor(obj)" :size="size"
                :centered="true">
            </City>
        </g>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import type { Player } from 'boardgame-web-common';
import { pointyHexToPixel } from 'boardgame-web-common';
import { CatanIntersectionObjectType, type CatanIntersection, type CatanIntersectionObject } from 'catan-back';
import Settlement from './Settlement.vue';
import City from './City.vue';


const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

function getPlayerColor(obj: CatanIntersectionObject) {
    return props.players?.find(player => player.userId == obj.playerId)?.color!
}

const size = computed(() => {
    return props.hexSize / 2.5
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanIntersection>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    },
    players: {
        type: Object as PropType<Array<Player>>,
        required: false
    }
})

const emit = defineEmits({
    click(_data: CatanIntersection) {
        return true
    },
})
</script>


<style scoped></style>