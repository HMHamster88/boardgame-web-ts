import type { GameFrontService } from "boardgame-web-common/front";
import type { Component } from "vue";

import CatanSettings from "./components/CatanSettings.vue";
import CatanGameView from "./components/CatanGameView.vue";

export const catanGameType = "CATAN"

export class CatanFrontService implements GameFrontService {
    type: string = catanGameType
    settingsComponent: Component = CatanSettings
    gameViewComponent: Component = CatanGameView
    localization: any = {
        en: {
            CATAN: 'Catan',
            playerAcceptedDeal: "{player} accepted deal",
            playersRejectedDeal: "All players rejected deal"
        },
        ru: {
            CATAN: 'Колонизаторы',
            playerAcceptedDeal: "{player} принял сделку",
            playersRejectedDeal: "Все игроки отклонили сделку"
        }
    }
    gameStaticSettings = {
        minPlayers: 2,
        maxPlayers: 6
    }

}