import type { Component } from "vue"
import type { GameStaticSettings } from "../back/dto"

export * from "./utils/colorUtils"
export { default as SelectPlayersDialog } from './components/SelectPlayersDialog.vue'

export interface GameFrontService {
    type: string
    readonly settingsComponent: Component
    readonly gameViewComponent: Component
    readonly playerComponent: Component | undefined
    readonly statisticsComponent: Component | undefined
    readonly localization: any
    gameStaticSettings: GameStaticSettings
}

export interface GameFrontModule {
    getGameFrontService: () => GameFrontService;
}
