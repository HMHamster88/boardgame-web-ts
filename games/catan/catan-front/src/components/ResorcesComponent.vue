<template>
    <div class="flex justify-center gap-3">
        <div class="flex overflow-auto gap-2 items-center">
            <o-icon icon="sigma"></o-icon>
            <span class="no-wrap">{{ allResourcesCount }}</span>
            <div v-for="[resourceType, resourceCount] in recordEntries(resources)" class="flex items-center">
                <img class="resource-icon" :src="resourcesImages[resourceType]"></img>
                <span class="m-1">{{ resourceCount }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { OIcon } from '@oruga-ui/oruga-next';
import { recordEntries } from 'boardgame-web-common';
import { getAllResourcesCount, type CatanResources } from 'catan-back';
import { computed, type PropType } from 'vue';
import { resourcesImages } from './graphics';

const allResourcesCount = computed(() => {
    return getAllResourcesCount(props.resources)
})

const props = defineProps({
    resources: {
        type: Object as PropType<CatanResources>,
        required: true
    }
})
</script>

<style>
.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>