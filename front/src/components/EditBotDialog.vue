<template>
    <o-dialog v-model:active="showDialog" modal :title="botCopy.userId ? t('editBot') : t('addBot')">
        <template #content>
            <o-field :label="t('botName')">
                <o-input id="name" v-model="botCopy.name" />
            </o-field>
            <o-field :label="t('botColor')">
                <input type="color" v-model="botColor" />
            </o-field>
        </template>
        <template #footer>
            <o-button :label="$t('cancel')" @click="close(false)" />
            <o-button :label="$t('ok')" @click="close(true)" />
        </template>
    </o-dialog>
</template>

<script setup lang="ts">
import type { Player } from 'boardgame-web-common';
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue';

const t = useI18n({
    locale: 'en',
    messages: {
        en: {
            editBot: 'Edit Bot',
            addBot: 'Add Bot',
            botName: 'Bot Name',
            botColor: 'Bot Color'
        },
        ru: {
            editBot: 'Редактировать бота',
            addBot: 'Добавить бота',
            botName: 'Имя бота',
            botColor: 'Цвет бота'
        }
    }
}).t

const showDialog = ref(false)

const botCopy = ref<Player>({ userId: '', color: '', name: '', isBot: true, online: true })

const botColor = computed({
    get: () => {
        return botCopy.value.color
    },
    set: (newValue) => {
        if (newValue.startsWith('#')) {
            botCopy.value.color = newValue
        } else {
            botCopy.value.color = '#' + newValue
        }
    }
})

var openPromise: Promise<Player>
var openPromiseResolve: (value: Player | PromiseLike<Player>) => void
var openPromiseReject: (reason?: any) => void

async function open(bot: Player): Promise<Player> {
    botCopy.value = Object.assign({}, bot)
    showDialog.value = true;
    openPromise = new Promise((resolve, reject) => {
        openPromiseResolve = resolve
        openPromiseReject = reject
    });

    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(botCopy.value)
    } else {
        openPromiseReject()
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>