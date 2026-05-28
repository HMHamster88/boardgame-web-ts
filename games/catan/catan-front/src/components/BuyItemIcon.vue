<template>
    <div v-if="type == CatanBuyItemType.ROAD" :style="roadStyle"></div>
    <Settlement v-else-if="type == CatanBuyItemType.SETTLEMENT" :color="color" :size="48"></Settlement>
    <City v-else-if="type == CatanBuyItemType.CITY" :color="color" :size="48"></City>
    <img v-else-if="type == CatanBuyItemType.DEVELOPMENT_CARD" :src="knightImage" style="height: 24px;"></img>
</template>

<script setup lang="ts">
import { CatanBuyItemType } from 'catan-back';
import { computed } from 'vue';
import Settlement from './Settlement.vue';
import City from './City.vue';
import { knightImage } from './graphics.js';

const roadStyle = computed(() => {
    return {
        height: '12px',
        width: '64px',
        'border-radius': '4px',
        'background-color': props.color,
        border: '1px solid black'
    }
})

const props = defineProps({
    type: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
})
</script>

<style></style>