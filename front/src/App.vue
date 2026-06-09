<template>
  <div class="app-layout">
    <Header></Header>
    <main class="mt-2 scroll-container">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue';
import { useLocalStore } from './services/localStore'
import { v4 as uuidv4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import { wsService } from './services/wsService'

const i18n = useI18n()


const localStore = useLocalStore();
if (!localStore.user.id) {
  localStore.user.id = uuidv4()
}

i18n.locale.value = localStore.settings.locale

wsService.start()
</script>