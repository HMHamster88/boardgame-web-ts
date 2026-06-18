<template>
    <o-dialog v-model:active="showDialog" modal :title="t('playerTradeOffer', { player: playerName?.name })"
        :closable="false" :closeOnBackdrop="false" :closeOnEscape="false">
        <div class="flex flex-col items-center">
            <div class="flex justify-center items-center gap-4 mb-8">
                <div class="flex flex-col gap-1 items-center" style="width: 50%;">
                    <span>{{ t('playerOffer') }}</span>
                    <div v-for="[resourceType, resourceCount] in nonNullOffered"
                        class="flex justify-center gap-2 items-center">
                        <img class="resource-icon" :src="resourcesImages[resourceType]">
                        </img>
                        <span class="m-1">{{ resourceCount }}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    <o-icon icon="arrow-left-right-bold"></o-icon>
                    <span class="pi pi-sort-alt rotate-90"></span>
                </div>
                <div class="flex flex-col gap-1 items-center" style="width: 50%;">
                    <span class="no-wrap">{{ t('playerWants') }} /</span>
                    <span class="no-wrap">{{ t('youHave') }}</span>
                    <div v-for="[resourceType, resourceCount] in nonNullRequired"
                        class="flex justify-center gap-2 items-center"
                        :class="{ 'opacity-40': !hasResources(resourceType) }">
                        <img class="resource-icon" :src="resourcesImages[resourceType]">
                        </img>
                        <span class="m-1">{{ resourceCount + '/' + availableResources[resourceType] }}</span>
                    </div>
                </div>
            </div>
            <span>{{ t('yourResources') }}</span>
            <ResorcesComponent :resources="availableResources"></ResorcesComponent>
        </div>
        <div class="flex justify-end gap-2">
            <o-button type="button" :label="$t('reject')" severity="secondary" @click="close(false)"></o-button>
            <o-button type="button" :label="$t('accept')" @click="close(true)" :disabled="!canAccept"></o-button>
        </div>
    </o-dialog>
</template>

<script setup lang="ts">

import { ODialog, OButton, OIcon } from '@oruga-ui/oruga-next';

import { computed, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Player } from 'boardgame-web-common'
import { filterRecord, partialRecordEntries, recordEntries } from 'boardgame-web-common'
import { type CatanPlayerTradeOffer, type CatanResources, type CatanResourceType } from 'catan-back'
import { resourcesImages } from './graphics'
import ResorcesComponent from "./ResorcesComponent.vue";

let localization: any = {
    en: {
        playerTradeOffer: '{player} offered a deal',
        playerOffer: 'Player offer',
        playerWants: 'Player Wants',
        youHave: 'You have',
        yourResources: 'Your Resources'
    },
    ru: {
        playerTradeOffer: '{player} предлагает сделку',
        playerOffer: 'Игрок предлагает',
        playerWants: 'Игрок хочет',
        youHave: 'У вас имеется',
        yourResources: 'Ваши ресурсы'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

function hasResources(resourceType: CatanResourceType) {
    if (!props.availableResources || !props.playerTradeOffer) {
        return false
    }
    const availableResource = props.availableResources[resourceType]
    const reqResource = props.playerTradeOffer.required[resourceType]
    if (!reqResource || !availableResource) {
        return false
    }
    return availableResource >= reqResource
}

const canAccept = computed(() => {
    if (!props.availableResources || !props.playerTradeOffer) {
        return false
    }
    return recordEntries(props.playerTradeOffer?.required).every(([type, count]) => {
        if (count == 0) {
            return true
        }
        const aResource = props.availableResources[type]
        if (!aResource) {
            return false
        }
        return count <= aResource
    })
})

const nonNullOffered = computed(() => {
    if (!props.playerTradeOffer) {
        return []
    }
    return partialRecordEntries(filterRecord(props.playerTradeOffer.offered, (_, count) => count != 0))
})

const nonNullRequired = computed(() => {
    if (!props.playerTradeOffer) {
        return []
    }
    return partialRecordEntries(filterRecord(props.playerTradeOffer?.required, (_, count) => count != 0))
})


const playerName = computed(() => {
    return props.players.find(pl => pl.userId == props.playerTradeOffer?.playerId)
})

const showDialog = computed(() => {
    if (!props.playerTradeOffer) {
        return false
    }
    if (props.playerTradeOffer.playerId == props.localPlayerId) {
        return false
    }
    if (props.playerTradeOffer.rejectedPlayerIds.includes(props.localPlayerId)) {
        return false
    }
    return true
})

function close(save: boolean) {
    emit('result', save)
}

const emit = defineEmits({
    result(_result: boolean) {
        return true
    }
})

const props = defineProps({
    availableResources: {
        type: Object as PropType<CatanResources>,
        required: true
    },
    playerTradeOffer: {
        type: Object as PropType<CatanPlayerTradeOffer | undefined>,
        required: true
    },
    localPlayerId: {
        type: String,
        required: true
    },
    players: {
        type: Object as PropType<Player[]>,
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