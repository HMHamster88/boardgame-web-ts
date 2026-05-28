import { createApp } from 'vue'
import App from './App.vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueQrcode from '@chenfengyuan/vue-qrcode';
import { createI18n } from 'vue-i18n'
import router from './router'
import { localizationMessages } from './localizationMessages';

import { Button, createOruga, Dialog, Dropdown, Field, Input, Select, Slider, Table, Tag, Notification } from "@oruga-ui/oruga-next";
import "@oruga-ui/theme-oruga/style.css";
import '@mdi/font/css/materialdesignicons.min.css';
import './style.css'

const app = createApp(App)

const oruga = createOruga();
oruga.use(Button)
oruga.use(Dialog)
oruga.use(Select)
oruga.use(Field)
oruga.use(Input)
oruga.use(Slider)
oruga.use(Dropdown)
oruga.use(Tag)
oruga.use(Table)
oruga.use(Notification);

app.use(oruga, {
    // here goes the global config
});

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: localizationMessages,
    datetimeFormats: {
        'en': {
            long: {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: false
            }
        },
        'ru': {
            long: {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: false,
            }
        }
    }
})

app.component('vue-qrcode', VueQrcode);
app.use(router)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(i18n)

app.mount('#app')

