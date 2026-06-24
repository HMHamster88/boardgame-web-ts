<template>
    <g :transform="transform" @click="emit('click', data)">
        <rect :class="rectClass" rx="5" ry="5" :width="hexSize / 4" :y="-hexSize / 2" :height="hexSize"
            :x="-hexSize / 8" />
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { getEdgeAnge, pointyHexToPixel, type Vector2DLike } from 'boardgame-web-common';
import { Vector2D } from 'boardgame-web-common';

const position = computed(() => {
    return pointyHexToPixel(props.data, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y}) rotate(${getEdgeAnge(props.data)})`
})

const rectClass = computed(() => {
    return {
        'edge': true,
        'edge-highlight': props.highlight ? props.highlight(props.data) : false
    }
})

const props = defineProps({
    data: {
        type: Object as PropType<Vector2D>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    },
    highlight: {
        type: Function as PropType<(position: Vector2DLike) => boolean>,
        required: false
    }
})

const emit = defineEmits({
    click(_data: Vector2D) {
        return true
    },
})

</script>

<style>
.edge {
    fill: transparent;
    stroke: transparent
}

.edge-highlight {
    fill: #51ff002d;
    stroke: rgb(120, 255, 47);
    cursor: pointer;
}
</style>