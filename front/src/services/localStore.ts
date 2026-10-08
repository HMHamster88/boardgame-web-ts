import { ConnectStatus, type Game, type GameType, type User } from 'boardgame-web-common/back'
import type { GameFrontService, PlayerGameSettings } from 'boardgame-web-common/front'
import { defineStore } from 'pinia'


export interface Settings {
    locale: string,
    soundsVolume: number,
    vibration: boolean
}

type PlayerGameSettingsMap = {
    [key: string]: PlayerGameSettings
}

interface LocalStore {
    user: User,
    settings: Settings,
    playerGameSettings: PlayerGameSettingsMap
}

export const useLocalStore = defineStore(
    'localStore',
    {
        state: (): LocalStore => ({
            user: {
                id: '',
                name: 'User',
                color: '#FF0000',
                roles: []
            },
            settings: {
                locale: 'en',
                soundsVolume: 0.5,
                vibration: true
            },
            playerGameSettings: {}
        }),
        persist: true
    }
)

interface MemoryLocalStore {
    connectStatus: ConnectStatus,
    gameTypes: GameType[],
    games: Game[],
    showStatistics: boolean,
    gameService: GameFrontService | undefined
}

export const useMemoryLocalStore = defineStore(
    'localStore',
    {
        state: (): MemoryLocalStore => ({
            connectStatus: ConnectStatus.DISCONNECTED,
            gameTypes: [],
            games: [],
            showStatistics: false,
            gameService: undefined
        }),
    }
)