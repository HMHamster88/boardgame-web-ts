<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="resource-cards-container">
                <div class="flex justify-center">
                    <div v-for="resource, index in flatResources" class="resource-card"
                        :class="{ 'resource-card-selected': selectedCardsInds.includes(index) }"
                        v-on:click="cardClick(index)"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="resourceCardsImg[resource]" class="resource-card-image">

                        </img>
                    </div>
                </div>
                <span v-if="developmentCards.length" class="cards-delimeter">{{ t('developmentCards') }}</span>
                <div class="flex justify-center">
                    <div v-for="devCard in developmentCards" class="resource-card" v-on:click="clickDevCard(devCard)"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="developmentCardsImgs[devCard]" class="resource-card-image">

                        </img>
                    </div>
                </div>
                <span v-if="openedDevelopmentCards.length" class="cards-delimeter">{{ t('usedDevelopmentCards')
                }}</span>
                <div class="flex justify-center">
                    <div v-for="devCard in openedDevelopmentCards" class="resource-card"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="developmentCardsImgs[devCard]" class="resource-card-image" style="cursor: default;">

                        </img>
                    </div>
                </div>
                <span v-if="specialCards.length" class="cards-delimeter">{{ t('specialCards') }}</span>
                <div class="flex justify-center">
                    <div v-for="specialCard in specialCards" class="special-card"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="specialCardsImgs[specialCard]" class="special-card-image">

                        </img>
                    </div>
                </div>
            </div>
        </div>
        <ResorcesComponent :resources="resources"></ResorcesComponent>
        <DevelopmentCardDialog ref="devCardDialog" :is-local-player-turn="isLocalPlayerTurn"></DevelopmentCardDialog>
    </div>
</template>

<script setup lang="ts">

import { computed, ref, useTemplateRef, watch, type PropType } from 'vue';
import { rangeArray, recordEntries, removeElement } from 'boardgame-web-common';
import type { CatanUseDevelopmentCardAction } from 'catan-back';
import { CatanSpecialCard, initResources, type CatanDevelopmentCardType, type CatanResources, getAllResourcesCount } from 'catan-back';
import DevelopmentCardDialog from './DevelopmentCardDialog.vue';
import { developmentCardsImgs, resourceCardsImg, specialCardsImgs } from './graphics';
import { useI18n } from 'vue-i18n';
import ResorcesComponent from './ResorcesComponent.vue';

let localization: any = {
    en: {
        developmentCards: 'Development Cards',
        usedDevelopmentCards: 'Used Development Cards',
        specialCards: 'Special Cards'
    },
    ru: {
        developmentCards: 'Карты Развития',
        usedDevelopmentCards: 'Использованные Карты\nРазвития',
        specialCards: 'Специальные карты'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const model = defineModel<CatanResources>()

watch(model, (newValue) => {
    if (newValue && getAllResourcesCount(newValue) == 0) {
        selectedCardsInds.value = []
    }
})

const selectedCardsInds = ref<number[]>([])
function cardClick(index: number) {

    if (selectedCardsInds.value.includes(index)) {
        removeElement(selectedCardsInds.value, index)
    } else {
        selectedCardsInds.value.push(index)
    }

    model.value = getSelectedResources()
}

function getSelectedResources() {
    const resources = initResources({})
    for (let index of selectedCardsInds.value) {
        const resurceType = flatResources.value[index]!
        resources[resurceType]++
    }
    return resources
}

const devCardDialog = useTemplateRef('devCardDialog')

async function clickDevCard(devCard: CatanDevelopmentCardType) {
    const action = await devCardDialog.value?.open(devCard);
    if (action) {
        emit('useDevCard', action)
    }
}

const emit = defineEmits<{
    (e: 'useDevCard', action: CatanUseDevelopmentCardAction): void
}>()


const props = defineProps({
    resources: {
        type: Object as PropType<CatanResources>,
        required: true
    },
    developmentCards: {
        type: Object as PropType<CatanDevelopmentCardType[]>,
        required: true
    },
    openedDevelopmentCards: {
        type: Object as PropType<CatanDevelopmentCardType[]>,
        required: true
    },
    specialCards: {
        type: Object as PropType<CatanSpecialCard[]>,
        required: true
    },
    isLocalPlayerTurn: {
        type: Boolean,
        required: true
    }
})

const flatResources = computed(() => {
    return recordEntries(props.resources).flatMap(([resourceType, resourceCount]) => rangeArray(resourceCount).map(() => resourceType))
})

</script>

<style>
.cards-delimeter {
    writing-mode: sideways-lr;
    font-size: small;
    text-align: center;
    white-space: pre-line;
}

.resource-cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    padding-top: 2rem;
    padding-bottom: 1rem;
}

.special-card {
    border-radius: 4px;
}

.special-card-image {
    border-radius: 4px;
    border: 1px solid #8f8f8f;
    max-width: 8rem;
}

.resource-cards-container .special-card:not(:first-child) {
    margin-left: -4rem;
}

.resource-card {
    border-radius: 8px;
    cursor: pointer;
}

.resource-card-image {
    border-radius: 8px;
    border: 1px solid #8f8f8f;
    width: 6rem;
    max-width: 6rem;
}

.resource-cards-container .resource-card:not(:first-child) {
    margin-left: -4rem;
}

.resource-icon {
    width: 2rem;
    max-width: 2rem;
}

.resource-card-selected {
    margin-top: -2rem;
}
</style>