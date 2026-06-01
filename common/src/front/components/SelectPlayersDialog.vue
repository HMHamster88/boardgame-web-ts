<template>
    <o-dialog v-model:active="showDialog" modal :header="multiple ? t('selctPlayers') : t('selectPlayer')">
        <div class="flex items-center" style="margin-bottom: 1rem;">
            <o-listbox :multiple="multiple" v-model="selectedPlayes" :options="players" ariaLabel="name" checkmark
                :highlightOnSelect="false" class="w-full md:w-56">
            </o-listbox>
        </div>
        <div class="flex justify-end gap-2">
            <o-button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></o-button>
            <o-button type="button" :label="$t('ok')" @click="close(true)" :disabled="!selectedPlayes"></o-button>
        </div>
    </o-dialog>
</template>

<script setup lang="ts">
import { ODialog, OButton, OListbox, type ListboxOptions } from '@oruga-ui/oruga-next';

import { useI18n } from 'vue-i18n';
import _ from 'lodash';
import type { Player } from "../../back/dto";
import { ref } from 'vue';

let localization: any = {
    en: {
        selctPlayers: 'Select Players',
        selectPlayer: 'Select Player'
    },
    ru: {
        selctPlayers: 'Выберите игроков',
        selectPlayer: 'Выберите игрока'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const showDialog = ref(false)

const players = ref<ListboxOptions<Player>>([])
const selectedPlayes = ref<Player[] | Player>([])
const multiple = ref(false)

var openPromise: Promise<Player[] | Player>

var openPromiseResolve: (value: Player[] | Player) => void

async function open(list: Player[], multi: boolean): Promise<Player[] | Player> {
    players.value = list.map(player => {
        return {
            label: player.name,
            value: player
        }
    })
    multiple.value = multi
    selectedPlayes.value = []
    showDialog.value = true;
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(selectedPlayes.value)
    } else {
        openPromiseResolve([])
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>