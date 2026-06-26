import { JSONFilePreset } from 'lowdb/node';
import {
    type Game,
    type GameSettings,
    type GameState,
    type User
} from 'boardgame-web-common/back';
import path from 'node:path';
import fs from 'node:fs/promises';
import _ from 'lodash';
import { DatabaseSync } from 'node:sqlite';
import { v4 as uuidv4 } from 'uuid';

const dbDir = './db';

const sqliteDbUrl = path.join(dbDir, 'db.sqlite')

const Tables = {
    USERS: 'users',
    GAMES: 'games',
    GAME_SETTINGS: 'game_settings',
    GAME_STATES: 'game_states',
    GAME_BACKUPS: 'game_backups'
} as const

type TablesType = typeof Tables[keyof typeof Tables];

interface IdObject {
    id: string
}

interface GameBackup {
    id: string
    gameId: string
    game: Game
    settings: GameSettings
    state: GameState
    date: Date
}

export class DB {
    sqliteDb!: DatabaseSync

    async init() {
        await fs.mkdir(dbDir, { recursive: true });
        this.sqliteDb = new DatabaseSync(sqliteDbUrl)
        Object.values(Tables).forEach(tableName => {
            this.sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id TEXT PRIMARY KEY,
                json TEXT
            )
        `);
        })
    }

    addDbObject<T extends IdObject>(table: TablesType, object: T): T {
        const insertStmt = this.sqliteDb.prepare(`INSERT INTO ${table} (id, json) VALUES (?, ?)`)
        insertStmt.run(object.id, JSON.stringify(object))
        return object
    }

    getDbObject<T extends IdObject>(table: TablesType, id: string): T | undefined {
        const selectOneStmt = this.sqliteDb.prepare(`SELECT * FROM ${table} WHERE id = ?`);
        const record = selectOneStmt.get(id)
        if (!record) {
            return undefined
        }
        return JSON.parse(record['json'] as string)
    }

    getAllDbObjects<T extends IdObject>(table: TablesType): T[] {
        const selectOneStmt = this.sqliteDb.prepare(`SELECT * FROM ${table}`);
        const records = selectOneStmt.all()
        return records.map(record => JSON.parse(record['json'] as string))
    }

    updateDbObject<T extends IdObject>(table: TablesType, object: T) {
        const updateStmt = this.sqliteDb.prepare(`UPDATE ${table} SET json = ? WHERE id = ?`);
        updateStmt.run(JSON.stringify(object), object.id)
    }

    deleteDbObject(table: TablesType, id: string) {
        const updateStmt = this.sqliteDb.prepare(`DELETE FROM ${table} WHERE id = ?`);
        updateStmt.run(id)
    }

    addUser(user: User) {
        return this.addDbObject(Tables.USERS, user)
    }

    getUser(id: string): User | undefined {
        return this.getDbObject<User>(Tables.USERS, id)
    }

    updateUser(user: User) {
        return this.updateDbObject(Tables.USERS, user)
    }

    addGame(game: Game) {
        return this.addDbObject(Tables.GAMES, game)
    }

    deleteGameAll(id: string) {
        this.deleteDbObject(Tables.GAMES, id)
        this.deleteDbObject(Tables.GAME_SETTINGS, id)
        this.deleteDbObject(Tables.GAME_STATES, id)
    }

    getGame(id: string): Game | undefined {
        return this.getDbObject<Game>(Tables.GAMES, id)
    }

    updateGame(game: Game) {
        return this.updateDbObject(Tables.GAMES, game)
    }

    getAllGames() {
        return this.getAllDbObjects<Game>(Tables.GAMES)
    }

    addGameSettings(settings: GameSettings) {
        return this.addDbObject(Tables.GAME_SETTINGS, settings)
    }

    updateGameSettings(settings: GameSettings) {
        return this.updateDbObject(Tables.GAME_SETTINGS, settings)
    }

    getGameSettings(id: string) {
        return this.getDbObject<GameSettings>(Tables.GAME_SETTINGS, id)
    }

    addGameState(state: GameState) {
        return this.addDbObject(Tables.GAME_STATES, state)
    }

    updateGameState(state: GameState) {
        return this.updateDbObject(Tables.GAME_STATES, state)
    }

    getGameState(id: string) {
        return this.getDbObject<GameState>(Tables.GAME_STATES, id)
    }

    createGameBackup(gameId: string) {
        const backup: GameBackup = {
            id: uuidv4(),
            gameId: gameId,
            game: this.getGame(gameId)!,
            settings: this.getGameSettings(gameId)!,
            state: this.getGameState(gameId)!,
            date: new Date()
        }
        this.addDbObject(Tables.GAME_BACKUPS, backup)
    }
}

export const db = new DB();
