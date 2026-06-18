import { findByCoordsArray, GameStatusEnum, getEdgeNeighborhoodsPositions, getHexEdgesPositions, getHexNeighborhoodsPositions, getHexVerticesPositions, getShuffledArray, getVertexHexesPositions, handleMessage, isOutEdge, randomElement, rangeArray, recordAsArray, recordEntries, removeCopmarableElements, removeElement, Vector2D, type Game, type GameAction, type GameBackService, type GameContext, type GameSettings, type GameState, type MesasgeHandlers, type Vector2DLike } from "boardgame-web-common/back";
import { CatanBuyItemType, CatanDevelopmentCardType, CatanDiceValue, CatanGamePhase, CatanIntersectionObjectType, CatanSpecialCard, CatanTradeType, developmentCardPoints, developmentCardSaves, developmentCardsCount, getBuyItems, initResources, intersectionObjectRoBuyItem, type CatanField, type CatanFieldGenerationSettings, type CatanGameSettings, type CatanGameStatistics, type CatanHarbour, type CatanIntersection, type CatanPlayerPrivateState, type CatanPlayerPublicState, type CatanPrivateGameState, type CatanPublicGameState, type CatanResources, type CatanRoad, type CatanTerrainHex } from "./types/types";
import { CatanGameFieldType } from "./types/catanGameFieldType";
import { CatanTerrainHexType } from "./types/catanTerrainHexType";
import _ from "lodash";
import type { CatanBuildIntObjectAction, CatanBuildRoadAction, CatanBuyDevelopmentCardAction, CatanDiscardResourceCards, CatanEmbarkAction, CatanEndTurnAction, CatanGenerateFieldAction, CatanMoveRobberAction, CatanRollDicesAction, CatanTradeAction, CatanTradeResponseAction, CatanUseDevelopmentCardAction, CatanUseResourceDevelopmentCardAction, CatanUseResourceTypeDevelopmentCardAction } from "./types/actions";
import { addResources, checkDeal, findLongestRoad, getAllResourcesCount, getNonNullResurceTypes, getPlayerPrices, loaclityTypes, moveAllResourcesByType } from "./types/utils";

const embarkRoadsCount = 2
const minLargestArmyCount = 3
const minLongestRoadCount = 5


export const CatanStaticSettings = {
    minPlayers: 2,
    maxPlayers: 6
}

export class CatanGameBackService implements GameBackService {

    startGame(game: Game, gameSettings: GameSettings): GameState {
        const settings = gameSettings as CatanGameSettings
        const publicPlayersStates = game.players.map(player => {
            const state: CatanPlayerPublicState = {
                playerId: player.userId,
                points: 0,
                openedDevelopmentCards: [],
                specialCards: [],
                resourceCount: 0
            }
            return state
        })
        const statisctics: CatanGameStatistics = {
            turnCount: 0,
            diceNumbersRolled: [],
            resourcesReceived: initResources({})
        }
        const publicState: CatanPublicGameState = {
            field: settings.field,
            phase: CatanGamePhase.EMBARK_FIRST,
            activePlayerIndex: _.random(0, game.players.length - 1),
            winnersIds: [],
            playersStates: publicPlayersStates,
            dices: {
                redDice: CatanDiceValue.ONE,
                yellowDice: CatanDiceValue.ONE
            },
            playerThrowedDices: false,
            playerTradeOffer: undefined,
            longestRoad: [],
            statistics: statisctics,
            onHandResources: initResources({})
        }
        const privatePlayerStates = game.players.map(player => {
            const state: CatanPlayerPrivateState = {
                playerId: player.userId,
                resources: initResources({}),
                discardCardsCount: 0,
                developmentCards: [],
                freeBuildings: []
            }
            return state
        })

        const developmentCardsDeck = getShuffledArray(Object.values(CatanDevelopmentCardType)
            .flatMap(type => rangeArray(developmentCardsCount[type]).map(_i => type)))

        const privateState: CatanPrivateGameState = {
            playersStates: privatePlayerStates,
            developmentCardsDeck: developmentCardsDeck,
            developmentCardDiscardPile: []
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        game.status = GameStatusEnum.STARTED

        return gameState
    }

    type = 'CATAN'
    localizedName = {
        en: {
            CATAN: 'Catan'
        },
        ru: {
            CATAN: 'Колонизаторы'
        }
    }

    gameStaticSettings = CatanStaticSettings

    getDefaultSettings(): GameSettings {
        const fieldGenerationSettings: CatanFieldGenerationSettings = {
            fieldType: CatanGameFieldType.CLASSIC,
            spreadHexTypes: true,
            spreadCircularNumbers: true,
        }
        const settings: CatanGameSettings = {
            id: '',
            fieldGenerationSettings: fieldGenerationSettings,
            field: this.generateField(fieldGenerationSettings),
            maxPoints: 10,
            maxResourceCount: 7,
            resourcesForEachEvenSettlement: true,
            resourceForRobberOnVacantHex: true
        }
        return settings
    }

    getAndRemoveFirstNotInArray<T>(source: T[], findArray: T[], comparator: ((a: T, b: T) => boolean)) {
        let index = source.findIndex(el => findArray.find((fel: T) => comparator(el, fel)) == undefined)
        if (index <= 0) {
            index = 0
        }
        const result = source[index]
        source.splice(index, 1)
        return result
    }

    generateField(settings: CatanFieldGenerationSettings): CatanField {
        const props = CatanGameFieldType.props[settings.fieldType]
        const terrainHexTypes = getShuffledArray(recordAsArray(props.terrainsCount).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))

        const circularNumbers = getShuffledArray(Array.from(props.circularNumberCount.entries()).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))

        const width = props.fieldWidth
        const height = props.fieldHeight
        const halfHeight = Math.round(height / 2)

        const hexes: CatanTerrainHex[] = []
        const hexPositions: Vector2D[] = []

        for (let y = 0; y < height; y++) {
            const rowWidth = width - Math.abs(halfHeight - y - 1)
            const shift = y < halfHeight ? y : halfHeight - 1
            for (let x = 0; x < rowWidth; x++) {
                const postion = new Vector2D(x - shift, y).multiplied(6)
                const nPositions = getHexNeighborhoodsPositions(postion)
                const nebourghouds = findByCoordsArray(nPositions, hexes)
                const nebourghoudsCircularNumbers = nebourghouds.map(n => n.circularNumber)
                const nebourghoudsHexTypes = nebourghouds.map(n => n.type)

                const hexType = settings.spreadHexTypes ? this.getAndRemoveFirstNotInArray(terrainHexTypes, nebourghoudsHexTypes, (a, b) => a == b) : terrainHexTypes.pop()!
                const circularNumber = hexType == CatanTerrainHexType.DESERT ? 0 :
                    (settings.spreadCircularNumbers ? this.getAndRemoveFirstNotInArray(circularNumbers, nebourghoudsCircularNumbers, (a, b) => a == b) : circularNumbers.pop()!)

                const terrainHex: CatanTerrainHex = {
                    position: postion,
                    type: hexType,
                    circularNumber: circularNumber
                }
                hexes.push(terrainHex)
                hexPositions.push(postion)
            }
        }

        const harbourTypes = getShuffledArray(recordAsArray(props.harborsCount).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))


        const outRoads = hexes.flatMap(hex => getHexEdgesPositions(hex.position))
            .filter(edge => isOutEdge(edge, hexPositions))

        const harbours: CatanHarbour[] = []

        while (harbourTypes.length) {
            const index = _.random(0, outRoads.length - 1)
            const harbourPos = outRoads[index]!
            const harborType = harbourTypes.pop()!
            const neighborhoodsPositions = getEdgeNeighborhoodsPositions(harbourPos)
            const harbour: CatanHarbour = {
                position: harbourPos,
                type: harborType
            }
            harbours.push(harbour)
            removeElement(outRoads, harbourPos)
            removeCopmarableElements(outRoads, neighborhoodsPositions)
        }

        return {
            width: props.fieldWidth,
            height: props.fieldHeight,
            hexes: hexes,
            harbours: harbours,
            roads: [],
            intersections: [],
            robberPos: hexes.find(hex => hex.type == CatanTerrainHexType.DESERT)?.position!
        }
    }

    async performAction(gameContext: GameContext, gameAction: GameAction, playerId: string): Promise<void> {
        const game = gameContext.game
        const gameState = gameContext.gameState
        const settings = gameContext.gameSettings as CatanGameSettings
        const isSettingsAction = await handleMessage<CatanGenerateFieldAction>({
            CatanGenerateFieldAction: () => {
                settings.field = this.generateField(settings.fieldGenerationSettings)
            }
        }, gameAction)

        if (isSettingsAction) {
            return
        }
        if (!gameState) {
            return
        }
        const publicState = gameState.publicState as CatanPublicGameState
        const statistics = gameState.publicState.statistics as CatanGameStatistics
        const field = publicState.field
        const privateState = gameState.privateState as CatanPrivateGameState
        const activePlayer = game.players[publicState.activePlayerIndex]
        const activePlayerId = activePlayer?.userId
        const privatePlayerState = privateState.playersStates.find(pl => pl.playerId == playerId)!
        const publicPlayerState = publicState.playersStates.find(pl => pl.playerId == playerId)!
        const activePlayerPrivteState = privateState.playersStates[publicState.activePlayerIndex]
        const isActivePlayerAction = playerId == activePlayerId

        type catanActionTypes = CatanEmbarkAction |
            CatanRollDicesAction |
            CatanBuildRoadAction |
            CatanBuildIntObjectAction |
            CatanEndTurnAction |
            CatanDiscardResourceCards |
            CatanMoveRobberAction |
            CatanTradeAction |
            CatanTradeResponseAction |
            CatanBuyDevelopmentCardAction |
            CatanUseDevelopmentCardAction

        const handlers: MesasgeHandlers<catanActionTypes> = {
            CatanEmbarkAction: (action: CatanEmbarkAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }
                const settlement: CatanIntersection = {
                    position: action.settlement,
                    intersectionObjects: [
                        {
                            playerId: playerId,
                            type: CatanIntersectionObjectType.SETTLEMENT
                        }
                    ]
                }

                const road: CatanRoad = {
                    playerId: playerId,
                    position: action.road
                }


                field.intersections.push(settlement)
                field.roads.push(road)

                if (publicState.phase == CatanGamePhase.EMBARK_SECOND) {
                    const resources = this.getResourcesForIntersection(field, settlement.position!, CatanIntersectionObjectType.SETTLEMENT)
                    this.addResourcesToPlayer(activePlayerPrivteState, resources)
                    addResources(statistics.resourcesReceived, resources)
                }

                const roadsCount = field.roads.length

                if (publicState.phase == CatanGamePhase.EMBARK_FIRST) {
                    if (roadsCount >= game.players.length) {
                        publicState.phase = CatanGamePhase.EMBARK_SECOND
                    } else {
                        publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                    }

                } else if (publicState.phase == CatanGamePhase.EMBARK_SECOND) {
                    publicState.activePlayerIndex--
                    if (publicState.activePlayerIndex < 0) {
                        publicState.activePlayerIndex = game.players.length - 1
                    }
                    if (roadsCount >= game.players.length * embarkRoadsCount) {
                        publicState.phase = CatanGamePhase.THROWING_DICE
                    }
                }
            },
            CatanRollDicesAction: async () => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const dices = publicState.dices

                dices.redDice = 0
                dices.yellowDice = 0
                gameContext.gamePublicStateSync?.sendUpdate('dices')
                await sleep(1000)

                dices.redDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)
                dices.yellowDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)

                const allDiceValue = (publicState.dices.redDice as number) + (publicState.dices.yellowDice)
                publicState.playerThrowedDices = true

                let statisticsDiceNuberRolled = statistics.diceNumbersRolled[allDiceValue]
                if (!statisticsDiceNuberRolled) {
                    statisticsDiceNuberRolled = 0
                }
                statisticsDiceNuberRolled++
                statistics.diceNumbersRolled[allDiceValue] = statisticsDiceNuberRolled


                if (allDiceValue == 7) {
                    let anyoneHasResourceExcess = false
                    for (let player of privateState.playersStates) {
                        const allResourcesCount = getAllResourcesCount(player.resources)
                        const maxPlayerResources = this.maxPlayerResources(player, settings)

                        if (allResourcesCount > maxPlayerResources) {
                            const discardCardsCount = Math.floor(allResourcesCount / 2)
                            player.discardCardsCount = discardCardsCount
                            anyoneHasResourceExcess = true
                        }
                    }
                    if (anyoneHasResourceExcess) {
                        publicState.phase = CatanGamePhase.DISCARD_CARDS_7
                    } else {
                        publicState.phase = CatanGamePhase.MOVE_ROBBER
                    }
                    return
                }

                const hexes = field.hexes.filter(hex => hex.circularNumber == allDiceValue)

                const playersUpdateId: string[] = []

                for (let hex of hexes) {
                    if (Vector2D.equals(hex.position, field.robberPos)) {
                        continue
                    }
                    const intObjects = findByCoordsArray(getHexVerticesPositions(hex.position), field.intersections)
                        .flatMap(int => int.intersectionObjects)
                    intObjects.forEach(intObject => {
                        const resources = this.getHexResources(hex.type, intObject.type)
                        const playerState = privateState.playersStates.find(player => player.playerId == intObject.playerId)!
                        this.addResourcesToPlayer(playerState, resources)
                        addResources(statistics.resourcesReceived, resources)
                        playersUpdateId.push(playerState.playerId)
                    })
                }

                publicState.phase = CatanGamePhase.PLAYER_TURN
            },
            CatanBuildRoadAction: (action: CatanBuildRoadAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const freeRoad = activePlayerPrivteState.freeBuildings?.find(building => building == CatanBuyItemType.ROAD)
                const resources = freeRoad ? initResources({}) : getBuyItems().find(item => item.type == CatanBuyItemType.ROAD)?.resources!
                if (!this.checkPlayerHasResources(activePlayerPrivteState, resources)) {
                    return
                }

                let road = field.roads.find(road => Vector2D.equals(road.position, action.position))
                if (road) {
                    console.debug(`Road on position ${action.position} already exists`)
                    return
                }
                // TODO CHECK CAN BUILD
                road = {
                    playerId: playerId,
                    position: action.position
                }
                field.roads.push(road)
                if (freeRoad) {
                    removeElement(activePlayerPrivteState.freeBuildings, freeRoad)
                } else {
                    this.removeResources(activePlayerPrivteState, resources)
                }
            },
            CatanBuildIntObjectAction: (action: CatanBuildIntObjectAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const buyItemType = intersectionObjectRoBuyItem(action.objectType)!
                const resources = getBuyItems().find(item => item.type == buyItemType)?.resources!
                if (!this.checkPlayerHasResources(activePlayerPrivteState, resources)) {
                    return
                }

                let int = field.intersections.find(int => Vector2D.equals(int.position, action.position))
                if (!int) {
                    int = {
                        position: action.position,
                        intersectionObjects: []
                    }
                    field.intersections.push(int)
                }
                let intObject = int.intersectionObjects.find(obj => obj.playerId == playerId && obj.type == action.objectType)
                if (intObject) {
                    console.debug(`Intersection object ${action.objectType} already exists at ${action.position}`)
                    return
                }
                if (action.objectType == CatanIntersectionObjectType.CITY) {
                    const settlement = int.intersectionObjects.find(obj => obj.playerId == playerId && obj.type == CatanIntersectionObjectType.SETTLEMENT)
                    if (!settlement) {
                        console.debug(`Cant buld city. No setlement at ${action.position}`)
                        return
                    }
                    settlement.type = CatanIntersectionObjectType.CITY
                } else {
                    intObject = {
                        type: action.objectType,
                        playerId: playerId
                    }
                    if (settings.resourcesForEachEvenSettlement && action.objectType == CatanIntersectionObjectType.SETTLEMENT) {
                        const localitiesCount = field.intersections.flatMap(int => int.intersectionObjects).filter(obj => obj.playerId == playerId && loaclityTypes.includes(obj.type)).length
                        if ((localitiesCount + 1) % 2 == 0) {
                            const resources = this.getResourcesForIntersection(field, action.position, CatanIntersectionObjectType.SETTLEMENT)
                            this.addResourcesToPlayer(activePlayerPrivteState, resources)
                            addResources(statistics.resourcesReceived, resources)
                        }
                    }
                    int.intersectionObjects.push(intObject)
                }

                this.removeResources(activePlayerPrivteState, resources)
            },
            CatanEndTurnAction: (_action: CatanEndTurnAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }
                publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                publicState.playerThrowedDices = false
                publicState.phase = CatanGamePhase.THROWING_DICE
                statistics.turnCount++
            },
            CatanDiscardResourceCards: (action: CatanDiscardResourceCards) => {
                if (privatePlayerState.discardCardsCount != getAllResourcesCount(action.resources)) {
                    console.debug('Invalid card discard count');
                    return;
                }

                this.removeResources(privatePlayerState, action.resources);
                privatePlayerState.discardCardsCount = 0;
                if (privateState.playersStates.every(ps => ps.discardCardsCount == 0)) {
                    publicState.phase = CatanGamePhase.MOVE_ROBBER;
                }
            },
            CatanMoveRobberAction: (action: CatanMoveRobberAction) => {
                field.robberPos = action.position
                if (action.playerToRob) {
                    const playerToRob = privateState.playersStates.find(ps => ps.playerId == action.playerToRob)!
                    if (getAllResourcesCount(playerToRob?.resources) > 0) {
                        const resourceType = randomElement(getNonNullResurceTypes(playerToRob.resources))
                        if (resourceType) {
                            const resourceRob = initResources({
                                [resourceType]: 1
                            })
                            this.removeResources(playerToRob, resourceRob)
                            this.addResourcesToPlayer(privatePlayerState, resourceRob)
                            const playerToRobName = game.players.find(p => p.userId == playerToRob.playerId)?.name
                            gameContext.sendNotify(playerId, 'youRobbed', { playerName: playerToRobName, t_resource: 'resourceType.' + resourceType })
                            gameContext.sendNotify(playerToRob.playerId, 'playerStoleFromYou', { playerName: activePlayer.name, t_resource: 'resourceType.' + resourceType })
                        }
                    }
                } else if (settings.resourceForRobberOnVacantHex) {
                    const hex = field.hexes.find(hex => Vector2D.equals(hex.position, action.position))
                    const resources = this.getHexResources(hex?.type!, CatanIntersectionObjectType.SETTLEMENT)
                    this.addResourcesToPlayer(privatePlayerState, resources)
                    addResources(statistics.resourcesReceived, resources)
                }
                if (publicState.playerThrowedDices) {
                    publicState.phase = CatanGamePhase.PLAYER_TURN
                } else {
                    publicState.phase = CatanGamePhase.THROWING_DICE
                }
            },
            CatanTradeAction: (action: CatanTradeAction) => {
                if (playerId != activePlayerId) {
                    return
                }
                const deal = action.deal
                if (!checkDeal(deal, getPlayerPrices(field, playerId), privatePlayerState.resources)) {
                    console.debug('Invalid deal')
                    return
                }
                if (deal.type == CatanTradeType.BANK) {
                    this.removeResources(privatePlayerState, deal.offered)
                    this.addResourcesToPlayer(privatePlayerState, deal.required)
                } else {
                    publicState.playerTradeOffer = {
                        playerId: playerId,
                        offered: deal.offered,
                        required: deal.required,
                        rejectedPlayerIds: []
                    }
                }
            },
            CatanTradeResponseAction: (action: CatanTradeResponseAction) => {
                const tradeOffer = publicState.playerTradeOffer
                if (!tradeOffer) {
                    console.debug('No active offer')
                    return
                }
                if (action.accepted) {
                    const tradePlayerState = privateState.playersStates.find(ps => ps.playerId == tradeOffer.playerId)!
                    this.removeResources(privatePlayerState, tradeOffer.required)
                    this.addResourcesToPlayer(privatePlayerState, tradeOffer.offered)

                    this.removeResources(tradePlayerState, tradeOffer.offered)
                    this.addResourcesToPlayer(tradePlayerState, tradeOffer.required)
                    publicState.playerTradeOffer = undefined
                    gameContext.sendNotify(tradeOffer.playerId, 'playerAcceptedDeal', { player: game.players.find(pl => pl.userId == playerId)?.name })
                } else {
                    tradeOffer.rejectedPlayerIds.push(playerId)
                    if (tradeOffer.rejectedPlayerIds.length >= game.players.length - 1) {
                        gameContext.sendNotify(tradeOffer.playerId, 'playersRejectedDeal', undefined)
                        publicState.playerTradeOffer = undefined
                    }
                }
            },
            CatanBuyDevelopmentCardAction: (_action: CatanBuyDevelopmentCardAction) => {
                if (privateState.developmentCardsDeck.length == 0) {
                    privateState.developmentCardsDeck = getShuffledArray(privateState.developmentCardDiscardPile)
                }
                privatePlayerState.developmentCards.push(privateState.developmentCardsDeck.pop()!)
                const cost = getBuyItems().find(item => item.type == CatanBuyItemType.DEVELOPMENT_CARD)?.resources!
                this.removeResources(privatePlayerState, cost)
            },
            CatanUseDevelopmentCardAction: (action: CatanUseDevelopmentCardAction) => {
                removeElement(privatePlayerState.developmentCards, action.developmentCard)
                if (developmentCardSaves[action.developmentCard]) {
                    publicPlayerState.openedDevelopmentCards.push(action.developmentCard)
                } else {
                    privateState.developmentCardDiscardPile.push(action.developmentCard)
                }

                switch (action.developmentCard) {
                    case CatanDevelopmentCardType.KNIGNT:
                        publicState.phase = CatanGamePhase.MOVE_ROBBER
                        return
                    case CatanDevelopmentCardType.BUILD_ROADS:
                        privatePlayerState.freeBuildings.push(CatanBuyItemType.ROAD, CatanBuyItemType.ROAD)
                        return
                    case CatanDevelopmentCardType.MONOPOLY:
                        const resourceTypeAction = action as CatanUseResourceTypeDevelopmentCardAction
                        privateState.playersStates.filter(ps => ps.playerId != playerId)
                            .forEach(playerState => {
                                moveAllResourcesByType(privatePlayerState.resources, playerState.resources, resourceTypeAction.resourcesType)
                            })
                        return
                    case CatanDevelopmentCardType.YEAR_OF_PLENTY:
                        const resourceAction = action as CatanUseResourceDevelopmentCardAction
                        addResources(statistics.resourcesReceived, resourceAction.resources)
                        this.addResourcesToPlayer(privatePlayerState, resourceAction.resources)
                }
            }
        }

        await handleMessage(handlers, gameAction)

        const publicPlayersPoints = new Map<string, number>(
            game.players.map(player => [player.userId, 0])
        )

        const privatePlayersPoints = new Map<string, number>(
            game.players.map(player => [player.userId, 0])
        )

        for (let obj of publicState.field.intersections.flatMap(int => int.intersectionObjects)) {
            switch (obj.type) {
                case CatanIntersectionObjectType.SETTLEMENT:
                    publicPlayersPoints.set(obj.playerId, publicPlayersPoints.get(obj.playerId)! + 1)
                    break
                case CatanIntersectionObjectType.CITY:
                    publicPlayersPoints.set(obj.playerId, publicPlayersPoints.get(obj.playerId)! + 2)
                    break
            }
        }

        for (let privatePlayerState of privateState.playersStates) {
            privatePlayerState.developmentCards.forEach(devCard => {
                privatePlayersPoints.set(privatePlayerState.playerId, privatePlayersPoints.get(privatePlayerState.playerId)! + developmentCardPoints[devCard])
            })
        }

        const biggestArmyPlayer = publicState.playersStates.reduce((prev, current) => (this.armyCount(prev) > this.armyCount(current)) ? prev : current)

        if (this.armyCount(biggestArmyPlayer) >= minLargestArmyCount) {
            const currentBiggestArmyPublicPlayer = publicState.playersStates.find(player => player.specialCards.includes(CatanSpecialCard.BIGGEST_ARMY))
            if (!currentBiggestArmyPublicPlayer || biggestArmyPlayer == currentBiggestArmyPublicPlayer || this.armyCount(biggestArmyPlayer) > this.armyCount(currentBiggestArmyPublicPlayer)) {
                publicPlayersPoints.set(biggestArmyPlayer.playerId, publicPlayersPoints.get(biggestArmyPlayer.playerId)! + 2)
                if (currentBiggestArmyPublicPlayer != biggestArmyPlayer) {
                    if (currentBiggestArmyPublicPlayer) {
                        removeElement(currentBiggestArmyPublicPlayer.specialCards, CatanSpecialCard.BIGGEST_ARMY)
                    }
                    const biggestArmyPublicPlayer = publicState.playersStates.find(player => player.playerId == biggestArmyPlayer.playerId)!
                    if (!biggestArmyPublicPlayer.specialCards.includes(CatanSpecialCard.BIGGEST_ARMY)) {
                        publicState.playersStates.find(player => player.playerId == biggestArmyPlayer.playerId)?.specialCards.push(CatanSpecialCard.BIGGEST_ARMY)
                    }
                }
            }
        }

        const longestRoad = findLongestRoad(game.players, field, minLongestRoadCount)

        if (longestRoad.length >= minLongestRoadCount) {
            const longestRoadPlayerId = longestRoad[0]?.playerId!
            const currentLongestRoadPlayerId = publicState.longestRoad[0]?.playerId
            const longestRoadPlayer = publicState.playersStates.find(player => player.playerId == longestRoadPlayerId)!
            const currentLongestRoadPlayer = publicState.playersStates.find(player => player.playerId == currentLongestRoadPlayerId)
            if (!currentLongestRoadPlayerId || longestRoadPlayerId == currentLongestRoadPlayerId || longestRoad.length > publicState.longestRoad.length) {
                publicPlayersPoints.set(longestRoadPlayer.playerId, publicPlayersPoints.get(longestRoadPlayer.playerId)! + 2)
                if (longestRoadPlayer != currentLongestRoadPlayer) {
                    if (currentLongestRoadPlayer) {
                        removeElement(currentLongestRoadPlayer.specialCards, CatanSpecialCard.LONGEST_ROAD)
                    }
                    if (!longestRoadPlayer.specialCards.includes(CatanSpecialCard.LONGEST_ROAD)) {
                        longestRoadPlayer.specialCards.push(CatanSpecialCard.LONGEST_ROAD)
                    }
                }
                publicState.longestRoad = _.cloneDeep(longestRoad)
            }

        }

        for (let player of gameState.publicState.playersStates!) {
            player.points = publicPlayersPoints.get(player.playerId)!
        }

        const allPoints = new Map<string, number>(
            game.players.map(player => {
                return [player.userId, publicPlayersPoints.get(player.userId)! + privatePlayersPoints.get(player.userId)!]
            })
        )

        const maxPlayerPointsId = Array.from(allPoints.entries()).reduce((prev, current) => (prev[1]! > current[1]!) ? prev : current)[0]

        publicState.playersStates.forEach(playerPublicState => {
            const privatePlayerState = privateState.playersStates.find(pl => pl.playerId == playerPublicState.playerId)!
            playerPublicState.resourceCount = getAllResourcesCount(privatePlayerState.resources)
        })

        const onHandResource = initResources({})

        privateState.playersStates.forEach(pl => {
            addResources(onHandResource, pl.resources)
        })

        publicState.onHandResources = onHandResource

        if (allPoints.get(maxPlayerPointsId)! >= settings.maxPoints) {
            game.status = GameStatusEnum.FINISHED
            gameState.publicState.winnersIds = [maxPlayerPointsId!]
        }
    }

    getResourcesForIntersection(field: CatanField, position: Vector2DLike, objType: CatanIntersectionObjectType): CatanResources {
        const hexPoitions = getVertexHexesPositions(position)
        const hexes = hexPoitions.map(hexPos => field.hexes.find(hex => Vector2D.equals(hexPos, hex.position))).filter(hex => hex)
        const resourcesList = hexes.map(hex => hex?.type!)
            .map(hexType => this.getHexResources(hexType, CatanIntersectionObjectType.SETTLEMENT))
        const result = initResources({})
        resourcesList.forEach(resource => {
            addResources(result, resource)
        })
        return result
    }

    armyCount(playerState: CatanPlayerPublicState) {
        return playerState.openedDevelopmentCards.filter(devCard => devCard == CatanDevelopmentCardType.KNIGNT).length
    }

    maxPlayerResources(_playerState: CatanPlayerPrivateState, settings: CatanGameSettings) {
        return settings.maxResourceCount
    }

    checkPlayerHasResources(playerState: CatanPlayerPrivateState, resources: CatanResources): boolean {
        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            let playerResource = playerState.resources[resourceType]
            if (playerResource < resourceCount) {
                return false
            }
        }
        return true
    }

    removeResources(playerState: CatanPlayerPrivateState, resources: CatanResources): boolean {
        if (!this.checkPlayerHasResources(playerState, resources)) {
            return false
        }

        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            playerState.resources[resourceType] -= resourceCount
        }

        return true
    }

    addResourcesToPlayer(playerState: CatanPlayerPrivateState, resources: CatanResources) {
        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            playerState.resources[resourceType] += resourceCount
        }
    }

    getHexResources(hex: CatanTerrainHexType, objectType: CatanIntersectionObjectType): CatanResources {
        const mainResource = CatanTerrainHexType.props[hex].mainResource
        if (!mainResource) {
            return initResources({})
        }

        if (objectType == CatanIntersectionObjectType.SETTLEMENT) {
            return initResources({
                [mainResource]: 1
            })
        } else if (objectType == CatanIntersectionObjectType.CITY) {
            return initResources({
                [mainResource]: 2
            })
        }
        return initResources({})
    }
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}