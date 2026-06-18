<template>
    <div class="flex flex-col">
        <span>{{ t('turnCount') }} : {{ catanStatistics.turnCount }}</span>
        <h5>{{ t('dices') }}</h5>
        <div v-for="diceVal in diceRollsStats" class="flex flex-row items-center">
            <span style="width: 3rem;">{{ diceVal.diceValue }} : {{ diceVal.count }}</span>
            <div class="progress" :data-label="diceVal.prcentage.toFixed(2) + '%'">
                <span class="value" :style="`width:${diceVal.prcentage}%;`"></span>
            </div>
        </div>
        <h5>{{ t('resources') }}</h5>
        <div v-for="resourceVal in resourcesStats" class="flex flex-row items-center">
            <img class="resource-icon" :src="resourcesImages[resourceVal.type]"></img>
            <span style="width: 3rem;"> : {{ resourceVal.count }}</span>
            <div class="progress" :data-label="resourceVal.prcentage.toFixed(2) + '%'">
                <span class="value" :style="`width:${resourceVal.prcentage}%;`"></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { GameStatistics } from 'boardgame-web-common';
import { CatanResourceType, getAllResourcesCount, type CatanGameStatistics } from 'catan-back';
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { resourcesImages } from './graphics';

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

interface DiceStat {
    diceValue: number
    count: number
    prcentage: number
}

const diceRollsStats = computed(() => {
    const result: DiceStat[] = []
    const allCount = catanStatistics.value.diceNumbersRolled.filter(n => n != null).reduce((a, b) => a + b, 0)
    for (let i = 0; i < catanStatistics.value.diceNumbersRolled.length; i++) {
        const numberRolled = catanStatistics.value.diceNumbersRolled[i]
        if (numberRolled != null) {
            result.push({
                diceValue: i,
                count: numberRolled,
                prcentage: (numberRolled / allCount * 100)
            })
        }
    }
    return result
})

interface ResourceStat {
    type: CatanResourceType
    count: number
    prcentage: number
}

const resourcesStats = computed(() => {
    const result: ResourceStat[] = []
    const allCount = getAllResourcesCount(catanStatistics.value.resourcesReceived)
    Object.entries(catanStatistics.value.resourcesReceived).forEach(([resourcesType, resourceCount]) => {
        result.push({
            type: resourcesType as CatanResourceType,
            count: resourceCount,
            prcentage: (resourceCount / allCount * 100)
        })
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

<style>
.progress {
    margin: 0.2rem;
    height: 1.5em;
    width: 100%;
    background-color: var(--oruga-control-background-color);
    position: relative;
    border-width: var(--oruga-control-border-width);
    border-style: solid;
    border-color: var(--oruga-control-border-color);
    border-radius: var(--oruga-border-radius);
}

.progress:before {
    content: attr(data-label);
    font-size: 0.8em;
    position: absolute;
    text-align: center;
    left: 0;
    right: 0;
}

.progress .value {
    background-color: var(--main-color);
    display: inline-block;
    height: 100%;
}

.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>