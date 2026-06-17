<template>
    <o-dialog :active="showDialog" :title="t('resourceExchange')" :closable="false" :closeOnBackdrop="false"
        :closeOnEscape="false">
        <template #content>
            <div class="flex flex-col">
                <o-select v-model="deal.type" :options="tradeTypes">
                </o-select>
                <div class="flex justify-center items-center" style="margin-top: 0.5rem;">
                    <div class="flex flex-col gap-1 items-center">
                        {{ t('myOffer') }}
                        <div v-for="resourceType in resourceTypes" class="flex items-center gap-2">
                            <CatanResourceCountSelector :resourceType="resourceType"
                                v-model="deal.offered[resourceType]"
                                :step="step(deal.type, resourceType, resourcePrices)"
                                :max="availableResources[resourceType]" :available="availableResources[resourceType]">
                            </CatanResourceCountSelector>
                            <span v-if="deal.type == CatanTradeType.BANK" class="text-nowrap">
                                {{ resourcePrices[resourceType] }}:1
                            </span>
                        </div>
                    </div>
                    <o-icon icon="arrow-left-right-bold" style="margin: 0.5rem;"></o-icon>
                    <div class="flex flex-col gap-1 items-center">
                        {{ t('iWant') }}
                        <div v-for="resourceType in resourceTypes">
                            <CatanResourceCountSelector :resourceType="resourceType"
                                v-model="deal.required[resourceType]">
                            </CatanResourceCountSelector>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <o-button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></o-button>
                <o-button type="button" :label="$t('ok')" @click="close(true)"
                    :disabled="!checkDeal(deal, resourcePrices, availableResources)"></o-button>
            </div>
        </template>
    </o-dialog>
</template>

<script setup lang="ts">

import { ODialog, OButton, OSelect, OIcon } from '@oruga-ui/oruga-next';

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { CatanResourceType, CatanTradeType, initResourcePrices, initResources, type CatanResourcePrices, type CatanResources, type CatanTradeDeal } from 'catan-back';
import { checkDeal } from 'catan-back';
import CatanResourceCountSelector from './CatanResourceCountSelector.vue';

let localization: any = {
    en: {
        myOffer: 'My Offer',
        iWant: 'I Want',
        tradeType: {
            BANK: 'With Bank',
            PLAYER: 'With Players'
        }
    },
    ru: {
        myOffer: 'Моё предложение',
        iWant: 'Я хочу',
        tradeType: {
            BANK: 'С Банком',
            PLAYER: 'С Игроками'
        }
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})


const resourceTypes = ref(Object.keys(CatanResourceType).map(v => v as CatanResourceType))

const availableResources = ref<CatanResources>(initResources({}))

function deafutlDeal() {
    const deal: CatanTradeDeal = {
        type: CatanTradeType.BANK,
        offered: initResources({}),
        required: initResources({})
    }
    return deal
}

const deal = ref<CatanTradeDeal>(deafutlDeal())

const tradeTypes = ref(Object.values(CatanTradeType).map(v => v as CatanTradeType)
    .map(tradeType => {
        return {
            value: tradeType,
            label: t('tradeType.' + tradeType)
        }
    })
)

function resetDeal() {
    const defaultDeal = deafutlDeal()
    defaultDeal.type = deal.value.type
    Object.assign(deal.value, defaultDeal)
}

function step(dealType: CatanTradeType, resourceType: CatanResourceType, resourcePrices: CatanResourcePrices) {
    return dealType == CatanTradeType.BANK ? resourcePrices[resourceType] : 1
}

watch(() => deal.value.type, () => {
    resetDeal()
})

const showDialog = ref(false)

const resourcePrices = ref(initResourcePrices({}, 4))

var openPromise: Promise<CatanTradeDeal | undefined>

var openPromiseResolve: (deal: CatanTradeDeal | undefined) => void

async function open(availableResourcesParam: CatanResources, resourcePricesParam: CatanResourcePrices): Promise<CatanTradeDeal | undefined> {
    resetDeal()
    availableResources.value = availableResourcesParam
    resourcePrices.value = resourcePricesParam
    showDialog.value = true
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(deal.value)
    } else {
        openPromiseResolve(undefined)
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>