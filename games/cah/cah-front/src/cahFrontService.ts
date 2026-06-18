import type { GameFrontService } from "boardgame-web-common/front";
import type { Component } from "vue";

import CatanSettings from "./components/Settings.vue";
import CatanGameView from "./components/GameView.vue";

export const cahGameType = "CARDS_AGAINST_HUMANITY"

export class CatanFrontService implements GameFrontService {
    type: string = cahGameType
    settingsComponent: Component = CatanSettings
    gameViewComponent: Component = CatanGameView
    playerComponent: Component | undefined = undefined
    statisticsComponent: Component | undefined = undefined
    localization: any = {
        en: {
            CARDS_AGAINST_HUMANITY: 'Cards Against Humanity'
        },
        ru: {
            CARDS_AGAINST_HUMANITY: 'Карты против всех'
        }
    }
    gameStaticSettings = {
        minPlayers: 3,
        maxPlayers: 10
    }

}