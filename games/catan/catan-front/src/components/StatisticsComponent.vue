<template>
    <div class="flex flex-col">
        <span>{{ t('turnCount') }} : {{ catanStatistics.turnCount }}</span>
        <h5>{{ t('dices') }}</h5>
        <span v-for="diceVal in diceRollsPercentage">{{ diceVal }}</span>
        <h5>{{ t('resources') }}</h5>
        <span v-for="resourceVal in resourcesPercentage">
            {{ resourceVal }}
        </span>
    </div>
</template>

<script setup lang="ts">
import type { GameStatistics } from 'boardgame-web-common';
import { getAllResourcesCount, type CatanGameStatistics } from 'catan-back';
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';

let localization: any = {
    en: {
        dices: 'Dices',
        turnCount: 'Turn Count',
        resourcesStat: 'Resources Received',
        resourceType: {
            WOOD: "Wood",
            WOOL: "Whool",
            GRAIN: "Grain",
            CLAY: "Clay",
            ORE: "Ore"
        }
    },
    ru: {
        dices: 'Кубики',
        turnCount: 'Количество Ходов',
        resources: 'Полученные Ресурсы',
        resourceType: {
            WOOD: "Дерево",
            WOOL: "Шерсть",
            GRAIN: "Зерно",
            CLAY: "Глина",
            ORE: "Руда"
        }
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const diceRollsPercentage = computed(() => {
    const result: string[] = []
    const allCount = catanStatistics.value.diceNumbersRolled.filter(n => n != null).reduce((a, b) => a + b, 0)
    for (let i = 0; i < catanStatistics.value.diceNumbersRolled.length; i++) {
        const numberRolled = catanStatistics.value.diceNumbersRolled[i]
        if (numberRolled != null) {
            result.push(`${i}: ${numberRolled} (${(numberRolled / allCount * 100).toFixed(1)}%)`)
        }
    }
    return result
})

const resourcesPercentage = computed(() => {
    const result: string[] = []
    const allCount = getAllResourcesCount(catanStatistics.value.resourcesReceived)
    Object.entries(catanStatistics.value.resourcesReceived).forEach(([resourcesType, resourceCount]) => {
        result.push(`${t('resourceType.' + resourcesType)}: ${resourceCount} (${(resourceCount / allCount * 100).toFixed(1)}%)`)
    })
    return result
})

const catanStatistics = computed(() => {
    return props.statistics as CatanGameStatistics
})

const props = defineProps({
    statistics: {
        type: Object as PropType<GameStatistics>,
        required: true
    }
})
</script>