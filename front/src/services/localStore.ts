import { ConnectStatus, type Game, type GameType, type User } from 'boardgame-web-common/back'
import { defineStore } from 'pinia'

export interface Settings {
    locale: string,
    soundsVolume: number
}

interface LocalStore {
    user: User,
    settings: Settings
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
                soundsVolume: 0.5
            }
        }),
        persist: true
    }
)

interface MemoryLocalStore {
    connectStatus: ConnectStatus,
    gameTypes: GameType[],
    games: Game[],
    showStatistics: boolean
}

export const useMemoryLocalStore = defineStore(
    'localStore',
    {
        state: (): MemoryLocalStore => ({
            connectStatus: ConnectStatus.DISCONNECTED,
            gameTypes: [],
            games: [],
            showStatistics: false
        }),
    }
)