<template>
    <g :transform="transform">
        <polygon :points="hexSting" :class="polygonClass" @click="$emit('click', data)"></polygon>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { hexagonString, pointyHexToPixel } from 'boardgame-web-common';
import type { Vector2D, Vector2DLike } from 'boardgame-web-common';

const hexSting = computed(() => hexagonString(props.hexSize / 4))

const position = computed(() => {
    return pointyHexToPixel(props.data, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

const polygonClass = computed(() => {
    return {
        'intersect': true,
        'intersect-highlight': props.highlight ? props.highlight(props.data) : false
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
.intersect {
    fill: transparent;
    stroke: transparent
}

.intersect-highlight {
    fill: #51ff002d;
    stroke: rgb(120, 255, 47);
    cursor: pointer;
}
</style>