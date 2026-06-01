<template>
    <g :transform="transform" @click="emit('click', data)">
        <image :href="portImage" x="0" :y="-hexSize / 2" :height="hexSize" />
        <image class="glowing" transform="rotate(90)" :href="harbourResourcesImages.get(data.type)" :x="-hexSize / 4"
            :y="-hexSize * 0.8" :height="hexSize * 0.4" />
        <text :y="-hexSize * 0.3" class="harbour-text" transform="rotate(90)">{{
            data.type == CatanHarbourType.THREE_TO_ONE ?
                "3 : 1" :
                "2 : 1"
        }}</text>

    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'


import { portImage, harbourResourcesImages } from './graphics'
import { Vector2D } from 'boardgame-web-common'
import { getEdgeAnge, pointyHexToPixel } from 'boardgame-web-common'
import { CatanHarbourType, type CatanHarbour } from 'catan-back'

const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y}) rotate(${getEdgeAnge(props.data.position) + props.outEdgeRotation})`
})


const props = defineProps({
    data: {
        type: Object as PropType<CatanHarbour>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    },
    size: {
        type: Vector2D,
        default: new Vector2D(1, 2)
    },
    outEdgeRotation: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits({
    click(_data: CatanHarbour) {
        return true
    },
})

</script>

<style>
.harbour-text {
    font-size: 10;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
    filter: drop-shadow(0 0 2px #ffffff);
}

.glowing {
    filter: drop-shadow(0 0 2px #ffffff);
}
</style>