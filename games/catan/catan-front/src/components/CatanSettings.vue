<template>
    <div>
        <div class="settings-header">
            <o-button v-on:click="generateGameField">{{ t('generateField') }}</o-button>
            <label for="type" class="font-semibold">{{ t('fieldType') }}</label>
            <o-select id="type" v-model="settings.fieldType" :options="fieldTypes" />
        </div>
        <CatanHexGrid :field="settings.field"></CatanHexGrid>
    </div>
</template>

<script setup lang="ts">

import { OButton, OSelect } from '@oruga-ui/oruga-next';

import { type PropType } from 'vue';
import CatanHexGrid from './CatanHexGrid.vue';
import { type CatanGameSettings } from 'catan-back';
import { type CatanGenerateFieldAction } from "catan-back";
import { CatanGameFieldType } from "catan-back";
import { useI18n } from 'vue-i18n';
import type { GameAction } from 'back-common';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            fieldTypes: {
                CLASSIC: 'Classic',
                EXTENDED: 'Extended'
            },
            fieldType: 'Field Type:',
            generateField: 'Generate Field'
        },
        ru: {
            fieldTypes: {
                CLASSIC: 'Класика',
                EXTENDED: 'Расширенный'
            },
            fieldType: 'Тип Поля:',
            generateField: 'Сгенерировать поле'
        }
    }
})

const fieldTypes = Object.values(CatanGameFieldType).filter(type => typeof type == 'string').map(type => {
    return { value: type, label: t('fieldTypes.' + type.toString()) }
})

function generateGameField() {
    const action: CatanGenerateFieldAction = {
        type: 'CatanGenerateFieldAction'
    }
    emit('performAction', action)
}

const props = defineProps({
    settings: {
        type: Object as PropType<CatanGameSettings>,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

</script>

<style>
.settings-header {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>