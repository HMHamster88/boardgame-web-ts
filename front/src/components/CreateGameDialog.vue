<template>
    <o-dialog v-model:active="showDialog" modal :title="t('createGame')" :style="{ width: '35rem' }">
        <template #content>
            <o-field :label="t('gameType')">
                <o-select id="language" v-model="type" :options="gameTypes" />
            </o-field>
            <o-field :label="t('gameName')">
                <o-input id="name" v-model="name" />
            </o-field>
        </template>
        <template #footer>
            <o-button :label="$t('cancel')" @click="close(false)" />
            <o-button :label="$t('ok')" @click="close(true)" />
        </template>
    </o-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { type CreateGameProps } from 'boardgame-web-common/back';
import { useLocalStore, useMemoryLocalStore } from '../services/localStore'
import { useI18n } from 'vue-i18n';
import _ from 'lodash';

let localization: any = {
    en: {
        createGame: 'Create Game',
        gameName: 'Name',
        gameType: 'Type',
        newGame: 'New Game'
    },
    ru: {
        createGame: 'Создать игру',
        gameName: 'Название',
        gameType: 'Тип',
        newGame: 'Новая игра'
    }
}

const memoryLocalStore = useMemoryLocalStore()

const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const localStore = useLocalStore();

const showDialog = ref(false)

interface GameNamedType {
    value: string
    label: string
}

const gameTypes = ref<GameNamedType[]>([])

const type = ref<string>('')

const name = ref(t(type.value))

var openPromise: Promise<CreateGameProps>

watch(type, newType => {
    name.value = t(newType)
})

var openPromiseResolve: (value: CreateGameProps | PromiseLike<CreateGameProps>) => void
var openPromiseReject: (reason?: any) => void

async function open(): Promise<CreateGameProps> {
    memoryLocalStore.gameTypes.forEach(type => {
        if (type.localizedName) {
            localization = _.merge(localization, type.localizedName)
        }
    })

    gameTypes.value = memoryLocalStore.gameTypes.map(type => {
        console.log('type', type)
        return {
            value: type.type,
            label: t(type.type)
        }
    })
    console.log(gameTypes)
    type.value = gameTypes.value[0].value

    showDialog.value = true;
    openPromise = new Promise((resolve, reject) => {
        openPromiseResolve = resolve
        openPromiseReject = reject
    });

    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve({
            name: name.value,
            type: type.value,
            owner: localStore.user.id
        })
    } else {
        openPromiseReject()
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>