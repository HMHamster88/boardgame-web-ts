import type { GameFrontService } from "boardgame-web-common/front";
import type { Component } from "vue";

import CatanSettings from "./components/CatanSettings.vue";
import CatanGameView from "./components/CatanGameView.vue";
import PlayerComponent from "./components/PlayerComponent.vue";
import StatisticsComponent from "./components/StatisticsComponent.vue";

export const catanGameType = "CATAN"

export class CatanFrontService implements GameFrontService {
    type: string = catanGameType
    settingsComponent: Component = CatanSettings
    gameViewComponent: Component = CatanGameView
    playerComponent: Component = PlayerComponent
    statisticsComponent: Component | undefined = StatisticsComponent
    localization: any = {
        en: {
            CATAN: 'Catan',
            playerAcceptedDeal: "{player} accepted deal",
            playersRejectedDeal: "All players rejected deal",
            youRobbed: 'You robbed {resource} from player {playerName}',
            playerStoleFromYou: 'Player {playerName} stole {resource} from you',
            resourceType: {
                WOOD: "wood",
                WOOL: "whool",
                GRAIN: "grain",
                CLAY: "clay",
                ORE: "ore"
            }
        },
        ru: {
            CATAN: 'Колонизаторы',
            playerAcceptedDeal: "{player} принял сделку",
            playersRejectedDeal: "Все игроки отклонили сделку",
            youRobbed: 'Вы украли {resource} у игрока {playerName}',
            playerStoleFromYou: 'Игрок {playerName} украл у вас {resource}',
            resourceType: {
                WOOD: "дерево",
                WOOL: "шерсть",
                GRAIN: "зерно",
                CLAY: "глина",
                ORE: "руда"
            }
        }
    }
    gameStaticSettings = {
        minPlayers: 2,
        maxPlayers: 6
    }

}