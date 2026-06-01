<template>
    <g :transform="transform">
        <polygon :points="hexSting" class="intersect-highlight" @click="$emit('click', data)"></polygon>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { hexagonString, pointyHexToPixel } from 'boardgame-web-common';
import type { Vector2D } from 'boardgame-web-common';

const hexSting = computed(() => hexagonString(props.hexSize / 4))

const position = computed(() => {
    return pointyHexToPixel(props.data, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

const props = defineProps({
    data: {
        type: Object as PropType<Vector2D>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    }
})

const emit = defineEmits({
    click(_data: Vector2D) {
        return true
    },
})
</script>


<style>
.intersect-highlight {
    fill: #51ff0000;
    transition: fill 0.1s ease-in-out, color 0.1s ease-in-out;
    cursor: pointer;
}

.intersect-highlight:hover {
    fill: #51ff008b;
}
</style>