import { JSONFilePreset } from 'lowdb/node';
import { Low } from 'lowdb';
import {
    findAndRemoveElement,
    type Game,
    type GameSettings,
    type GameState,
    removeElement,
    type User
} from 'boardgame-web-common/back';
import path from 'node:path';
import fs from 'node:fs/promises';
import _ from 'lodash';
import { format } from 'date-fns';

const dbDir = './db';

export class DB {
    users: Low<User[]> | undefined;
    games: Low<Game[]> | undefined;
    gamesSettings: Low<GameSettings[]> | undefined;
    gamesStates: Low<GameState[]> | undefined;

    async init() {
        await fs.mkdir(dbDir, { recursive: true });
        this.users = await JSONFilePreset<User[]>(path.join(dbDir, 'users.json'), []);
        this.games = await JSONFilePreset<Game[]>(path.join(dbDir, 'games.json'), []);
        this.gamesSettings = await JSONFilePreset<GameSettings[]>(
            path.join(dbDir, 'games-settings.json'),
            []
        );
        this.gamesStates = await JSONFilePreset<GameState[]>(
            path.join(dbDir, 'games-states.json'),
            []
        );
    }

    async addUser(user: User) {
        this.users?.data.push(user);
        await this.users?.write();
        return user;
    }

    getUser(id: string) {
        return this.users?.data.find((user) => user.id == id);
    }

    updateUser(user: User) {
        const existingUser = this.users?.data.find((u) => u.id == user.id);
        if (existingUser) {
            _.merge(existingUser, user);
            this.users?.write();
        }
    }

    async addGame(game: Game) {
        this.games?.data.push(game);
        await this.games?.write();
    }

    async deleteGameAll(id: string) {
        const game = this.getGame(id);
        if (!game) {
            return;
        }
        removeElement(this.games?.data!, game);
        findAndRemoveElement(this.gamesSettings?.data!, (el) => el.id == id);
        findAndRemoveElement(this.gamesStates?.data!, (el) => el.id == id);
        this.games?.write();
        this.gamesSettings?.write();
        this.gamesStates?.write();
    }

    getGame(id: string) {
        return this.games?.data.find((game) => game.id == id);
    }

    updateGame(game: Game) {
        const data = this.games?.data!;
        const gameIndex = data.findIndex((g) => g.id == game.id)!;
        data[gameIndex] = game;
        this.games?.write();
    }

    getAllGames() {
        return this.games?.data!;
    }

    async addGameSettings(settings: GameSettings) {
        this.gamesSettings?.data.push(settings);
        await this.gamesSettings?.write();
    }

    async updateGameSettings(settings: GameSettings) {
        const data = this.gamesSettings?.data!;
        const index = data.findIndex((g) => g.id == settings.id)!;
        data[index] = settings;
        this.gamesSettings?.write();
    }

    getGameSettings(id: string) {
        return this.gamesSettings?.data.find((settings) => settings.id == id);
    }

    async addGameState(state: GameState) {
        this.gamesStates?.data.push(state);
        await this.gamesStates?.write();
    }

    async updateGameState(settings: GameState) {
        const existingState = this.getGameState(settings.id);
        if (existingState) {
            _.merge(existingState, settings);
            await this.gamesStates?.write();
        }
    }

    getGameState(id: string) {
        return this.gamesStates?.data.find((state) => state.id == id);
    }

    async createGameBackup(id: string) {
        const state = this.gamesStates?.data.find((state) => state.id == id);
        const game = this.games?.data.find((game) => game.id == id);
        const gameDir = path.join(dbDir, 'game-backup', id)
        console.log('Game dir', gameDir)
        await fs.mkdir(gameDir, { recursive: true });
        const dateString = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const stateFileName = path.join(gameDir, `${dateString}-state.json`)
        const stateBackup = await JSONFilePreset<GameState>(stateFileName, state!);
        await stateBackup.write()
        const gameFileName = path.join(gameDir, `${dateString}-game.json`)
        const gameBackup = await JSONFilePreset<Game>(gameFileName, game!);
        await gameBackup.write()
        return stateFileName
    }
}

export const db = new DB();
