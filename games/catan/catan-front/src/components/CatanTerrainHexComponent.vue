<template>
    <g :transform="transform" @click="emit('click', data)">
        <polygon :points="hexagonString(size)" :fill="`url(#${data.type})`">
        </polygon>
        <circle v-if="allDiceValue == data.circularNumber && allDiceValue != 0" :r="size / 3" class="circle-highlight">
        </circle>
        <text v-if="data.circularNumber" :class="curcularTextClass" :style="circularTextStyle">
            {{ data.circularNumber }}
        </text>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { hexagonString, pointyHexToPixel } from 'boardgame-web-common'
import type { CatanTerrainHex } from 'catan-back'

const dropChances = new Map<number, number>([
    [2, 1 / 36],
    [3, 1 / 18],
    [4, 1 / 12],
    [5, 1 / 9],
    [6, 5 / 36],
    [8, 5 / 36],
    [9, 1 / 9],
    [10, 1 / 12],
    [11, 1 / 18],
    [12, 1 / 36]
])

const curcularTextClass = computed(() => {

    return {
        'circular-number-text': true,
        'highlight': props.allDiceValue == props.data.circularNumber,
    }
})

const minCircularSize = 18
const maxCircularSize = 32
const maxDropChance = dropChances.get(6)!

const circularTextStyle = computed(() => {
    const dropChance = dropChances.get(props.data.circularNumber)
    if (!dropChance) {
        return {}
    }
    const size = minCircularSize + (maxCircularSize - minCircularSize) * dropChance / maxDropChance
    return {
        'font-size': size + 'px',
        'fill': props.data.circularNumber == 8 || props.data.circularNumber == 6 ? 'red' : undefined
    }
})

const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.size).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanTerrainHex>,
        required: true
    },
    size: {
        type: Number,
        default: 20
    },
    allDiceValue: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits({
    click(_data: CatanTerrainHex) {
        return true
    }
})

</script>

<style>
.circular-number-text {
    font-size: 32px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
    paint-order: stroke;
    fill: white;
    stroke: #000000;
    stroke-width: 3px;
    stroke-linecap: butt;
    stroke-linejoin: miter;
}

.highlight {
    fill: rgb(84, 253, 0);
}

.circle-highlight {
    fill: rgba(84, 253, 0, 0.7);
}
</style>