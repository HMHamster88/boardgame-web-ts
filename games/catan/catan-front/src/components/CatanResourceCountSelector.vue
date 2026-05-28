<template>
    <div class="flex items-center" style="gap: 0.25rem;">
        <o-button icon-left="minus" class="resurce-count-button" v-on:click="decrease()"
            :disabled="!cadDecrease"></o-button>
        <div class="flex flex-col items-center">
            <img class="resource-coount-selector-icon" :src="resourcesImages[resourceType]">
            </img>
            <span class="m-1">{{ available != undefined ? `${model}/${available}` : model }}</span>
        </div>
        <o-button icon-left="plus" class="resurce-count-button" v-on:click="increase()"
            :disabled="!canIncrease"></o-button>
    </div>
</template>

<script setup lang="ts">

import { OButton } from '@oruga-ui/oruga-next';

import { computed, type PropType } from 'vue';
import type { CatanResourceType } from 'catan-back';
import { resourcesImages } from './graphics';

const model = defineModel({ default: 0 })

const canIncrease = computed(() => {
    return model.value <= props.max - props.step
})

const cadDecrease = computed(() => {
    return model.value >= props.min + props.step
})

function increase() {
    if (model.value < props.max - props.step + 1) {
        model.value += props.step
    }
}

function decrease() {
    if (model.value > props.min) {
        if (model.value <= props.step) {
            model.value = 0
        } else {
            model.value -= props.step
        }
    }
}

const props = defineProps({
    resourceType: {
        type: String as PropType<CatanResourceType>,
        required: true
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    step: {
        type: Number,
        default: 1
    },
    available: {
        type: Number
    }
})
</script>

<style>
.resource-coount-selector-icon {
    width: 1.5rem;
    max-width: 1.5rem;
    margin: 0;
}

.resurce-count-button {
    width: 2rem;
}
</style>