<template>
    <div class="flex justify-center items-center mb-2">{{ t('onHandResources') }}</div>
    <ResorcesComponent :resources="gameState.onHandResources"></ResorcesComponent>
    <div>
        <CatanHexGrid v-if="gameState.field" :field="gameState.field" @road-overlay-click="roadOverlayClick"
            :highlight-vertices="highlightVertices" :highlight-edges="highlightEdges"
            :longest-road="gameState.longestRoad" :players="game.players"
            @intersection-overlay-click="intersectionOverlayClick" @hex-click="hexClick" :all-dice-value="allDiceValue">
        </CatanHexGrid>
    </div>

    <div class="flex justify-center items-center mb-2">{{ status }}</div>
    <div class="flex gap-2 justify-center items-center">
        <div :class="diceContainerClass" v-on:click="rollDices">
            <Dice color="#ee3232" :result="dices.redDice" :highlight="canRollDices"></Dice>
            {{ dices.redDice + dices.yellowDice }}
            <Dice color="#FFFF00" :result="dices.yellowDice"></Dice>
        </div>
    </div>
    <div class="flex gap-2 justify-center items-center">
        <o-tooltip :label="t('embark')">
            <o-button v-if="showEmbarkButton" @click="embark" :disabled="!canEmbark"
                icon-left="map-marker-down"></o-button>
        </o-tooltip>
        <o-dropdown :active="buyMenuActive" @open="buyClick()">
            <template #trigger>
                <o-tooltip :label="t('buy')">
                    <o-button icon-left="cart-arrow-down"></o-button>
                </o-tooltip>
            </template>
            <o-dropdown-item v-for="item in buyItems" @click="buyItemClick(item)">
                <div class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
                    :class="{ 'buy-item-dsabled': !canBuyItem(item) }">
                    <div style="width: 1rem;" class="flex items-center justify-center">
                        {{ availableBuyItems[item.type] == undefined ? '∞' : availableBuyItems[item.type] }}
                    </div>
                    <div style="width: 2rem;" class="flex items-center justify-center">
                        <BuyItemIcon :type="item.type" :color="localPlayer.color"></BuyItemIcon>
                    </div>
                    <div v-for="resource in getFlatResources(item.resources)" class="flex items-center">
                        <img :src="resourcesImages[resource]" style="width: 24px; height: 24px;" />
                    </div>
                </div>
            </o-dropdown-item>
        </o-dropdown>

        <o-tooltip :label="t('discardCards')">
            <o-button v-if="needToDiscardCards" :disabled="!discardCardsEnabled" v-on:click="discardCards"
                icon-left="trash-can-outline">
            </o-button>
        </o-tooltip>
        <o-tooltip :label="t('resourceExchange')">
            <o-button @click="trade" :disabled="!canTrade" icon-left="cash-sync"></o-button>
        </o-tooltip>
        <o-tooltip :label="t('endTurn')">
            <o-button :disabled="!canEndTurn" v-on:click="endTurn()" icon-left="clock-end"></o-button>
        </o-tooltip>

        <o-dropdown>
            <template #trigger>
                <o-button icon-left="menu"></o-button>
            </template>
            <o-dropdown-item>
                <o-switch :label="t('showSettlementBuildPlaces')" v-model="showSettlementBuildPlaces" />
            </o-dropdown-item>
        </o-dropdown>
    </div>
    <CatanResourceCards v-if="playerPrivateState && playerPrivateState.resources" v-model="selectedResorceCards"
        :resources="playerPrivateState.resources" :development-cards="playerPrivateState.developmentCards"
        :special-cards="publicPlayerState?.specialCards"
        :opened-development-cards="publicPlayerState?.openedDevelopmentCards!" v-on:use-dev-card="useDevCard"
        :is-local-player-turn="isLocalPlayerTurn">
    </CatanResourceCards>

    <SelectPlayersDialog ref="selectPlayesDialog"></SelectPlayersDialog>
    <CatanTradeDialog ref="tradeDialog"></CatanTradeDialog>
    <div v-if="gameState.playerTradeOffer">
        <PlayerTradeOfferDialog :available-resources="playerPrivateState.resources" :players="game.players"
            :player-trade-offer="gameState.playerTradeOffer" :local-player-id="localPlayer.userId"
            @result="playerTradeOfferResult">
        </PlayerTradeOfferDialog>
        <TradeOfferAnswerDialog :players="game.players" :player-trade-offer="gameState.playerTradeOffer"
            :local-player-id="localPlayer.userId"></TradeOfferAnswerDialog>
    </div>
</template>

<script setup lang="ts">

import { OButton, ODropdown, OTooltip, ODropdownItem, OSwitch } from "@oruga-ui/oruga-next";

import { default as Dice } from './Dice.vue';

import { computed, ref, useTemplateRef, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { SelectPlayersDialog } from 'boardgame-web-common/front';
import { distinct, GameStatusEnum, type Game } from 'boardgame-web-common';
import type { GameAction, Player } from 'boardgame-web-common';
import { rangeArray, recordEntries, recordValues, removeElement } from 'boardgame-web-common';
import {
    findByCoords,
    getEdgeNeighborhoodsPositions,
    getEdgeVerticesPositions,
    getHexVerticesPositions,
    getVertexEdgesPositions,
    getVertexNeighborhoodsPositions,
    toCoordsArray
} from 'boardgame-web-common';
import { Vector2D, type Vector2DLike } from 'boardgame-web-common';
import {
    getAllResourcesCount,
    type CatanBuildIntObjectAction,
    type CatanBuildRoadAction,
    type CatanBuyDevelopmentCardAction,
    type CatanDiscardResourceCards,
    type CatanEmbarkAction,
    type CatanEndTurnAction,
    type CatanMoveRobberAction,
    type CatanRollDicesAction,
    type CatanTradeAction,
    type CatanTradeResponseAction,
    type CatanUseDevelopmentCardAction
} from "catan-back";
import {
    buyItemToIntersectionObject,
    CatanBuyItemType,
    catanEmbarkPhases,
    CatanGamePhase,
    CatanIntersectionObjectType,
    getBuyItems,
    initResources,
    type CatanBuyItem,
    type CatanDices, type CatanIntersection,
    type CatanPlayerPrivateState,
    type CatanPublicGameState,
    type CatanResources,
    type CatanRoad,
    type CatanTerrainHex
} from 'catan-back';
import { getAvailableBuyItems, getPlayerPrices } from 'catan-back';
import CatanHexGrid from './CatanHexGrid.vue';
import CatanResourceCards from './CatanPlayerCards.vue';
import CatanTradeDialog from './CatanTradeDialog.vue';
import { resourcesImages } from './graphics';
import PlayerTradeOfferDialog from './PlayerTradeOfferDialog.vue';
import TradeOfferAnswerDialog from './TradeOfferAnswerDialog.vue';
import BuyItemIcon from './BuyItemIcon.vue';
import ResorcesComponent from "./ResorcesComponent.vue";

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            buy: 'Buy',
            buyItems: {
                'ROAD': 'Road',
                'SETTLEMENT': 'Settelment',
                'CITY': 'City',
                'DEVELOPMENT_CARD': 'Development Card'
            },
            endTurn: 'End Turn',
            embark: 'Embark',
            press: 'Press',
            status: {
                localPlayer: {
                    EMBARK_FIRST: 'Place first settlement and road',
                    EMBARK_SECOND: 'Place second settlement and road',
                    THROWING_DICE: 'Throw dices',
                    PLAYER_TURN: 'Your turn',
                    DISCARD_CARDS_7: '7 fell on dice, need to discard {count} cards',
                    MOVE_ROBBER: 'Choose new place for robber'
                },
                notLocalPlayer: {
                    EMBARK_FIRST: '{player} choosing embark place',
                    EMBARK_SECOND: '{player} choosing embark place',
                    THROWING_DICE: '{player} throwing dices',
                    PLAYER_TURN: '{player} turn',
                    DISCARD_CARDS_7: '7 fell on dice, players discarding cards',
                    MOVE_ROBBER: '{player} choosing new place for robber'
                }
            },
            build: {
                ROAD: 'Choose place for road',
                SETTLEMENT: 'Choose place for settlement',
                CITY: 'Choose settlement for upgrade'
            },
            discardCards: 'Discard cards',
            onHandResources: 'Players on hand resources',
            showSettlementBuildPlaces: 'Settlement build places'
        },
        ru: {
            buy: 'Купить',
            buyItems: {
                'ROAD': 'Дорога',
                'SETTLEMENT': 'Поселение',
                'CITY': 'Город',
                'DEVELOPMENT_CARD': 'Карта развития'
            },
            endTurn: 'Закончить ход',
            embark: 'Высадисться',
            press: 'Нажмите',
            status: {
                localPlayer: {
                    EMBARK_FIRST: 'Поставте первое поселение и дорогу',
                    EMBARK_SECOND: 'Поставте второе поселение и дорогу',
                    THROWING_DICE: 'Ваш ход. Кидайте кубы',
                    PLAYER_TURN: 'Ваш ход',
                    DISCARD_CARDS_7: 'Выпало 7 необходимо сбросить карты {count} шт',
                    MOVE_ROBBER: 'Выберите новое место для разбойника'
                },
                notLocalPlayer: {
                    EMBARK_FIRST: '{player} выбирает место посадки',
                    EMBARK_SECOND: '{player} выбирает место посадки',
                    THROWING_DICE: '{player} кидает кубы',
                    PLAYER_TURN: '{player} ходит',
                    DISCARD_CARDS_7: 'Выпало 7 игроки сбрасывают карты',
                    MOVE_ROBBER: '{player} выбирает новое место для разбойника'
                }
            },
            build: {
                ROAD: 'Выберите место для дороги',
                SETTLEMENT: 'Выберите место для поселения',
                CITY: 'Выберите поселение для улучшения'
            },
            discardCards: 'Сбросить карты',
            onHandResources: 'Ресурсы на руках у игроков',
            showSettlementBuildPlaces: 'Места для постройки поселений'
        }
    }
})

const showSettlementBuildPlaces = ref(false)

function intersectionNotEpmty(position: Vector2DLike) {
    const intersection = intersectsByCoords.value.get(position)
    if (!intersection) {
        return false
    }
    return intersection.intersectionObjects.length > 0
}

const highlightVertices = (position: Vector2DLike): boolean => {
    if (showSettlementBuildPlaces.value) {
        return !intersectionNeighbourhoodsOcupated(position) && !intersectionNotEpmty(position)
    }

    if (!isLocalPlayerTurn.value) {
        return false
    }
    if (catanEmbarkPhases.includes(props.gameState.phase)) {

        if (embarkData.value.settlement) {
            return false
        }
        return !intersectionNeighbourhoodsOcupated(position) && !intersectionNotEpmty(position)
    }

    if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
        if (buildItemType.value && [CatanBuyItemType.SETTLEMENT, CatanBuyItemType.CITY].includes(buildItemType.value)) {
            const intObjectType = buyItemToIntersectionObject(buildItemType.value)
            if (!intObjectType) {
                return false
            }

            if (!canBuildIntObject(intObjectType, position, localPlayer.value.userId)) {
                return false
            }
            return true
        }
    }
    return false
}

const highlightEdges = (position: Vector2DLike): boolean => {
    if (!isLocalPlayerTurn.value) {
        return false
    }
    if (catanEmbarkPhases.includes(props.gameState.phase)) {
        if (embarkData.value.road) {
            return false
        }
        return canEmbarkRoad(position)
    }
    if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
        if (buildItemType.value == CatanBuyItemType.ROAD || freeBuilding.value) {
            let road = roadsByCoords.value.get(position)
            if (road) {
                return false
            }
            if (!canBuildRoad(position)) {
                return false
            }
            return true
        }
    }
    return false
}

function useDevCard(action: CatanUseDevelopmentCardAction) {
    performAction<CatanUseDevelopmentCardAction>(action)
}

const freeBuilding = computed(() => {
    if (!props.playerPrivateState.freeBuildings) {
        return undefined
    }
    return props.playerPrivateState.freeBuildings[props.playerPrivateState.freeBuildings.length - 1]
})

const status = computed(() => {
    if (props.game.status == GameStatusEnum.FINISHED) {
        return t('gameFinished')
    }
    const phase = props.gameState.phase
    if (phase == CatanGamePhase.PLAYER_TURN && isLocalPlayerTurn) {
        if (buildItemType.value) {
            return t('build.' + buildItemType.value as string)
        }
        if (freeBuilding.value) {
            return t('build.' + freeBuilding.value as string)
        }
    }

    if (phase == CatanGamePhase.DISCARD_CARDS_7) {
        if (props.playerPrivateState.discardCardsCount > 0) {
            const discardCount = props.playerPrivateState.discardCardsCount - getAllResourcesCount(selectedResorceCards.value)
            if (discardCount == 0) {
                return t('press') + ' ' + t('discardCards')
            }
            return t(`status.localPlayer.${phase}`, discardCount);
        } else {
            return t(`status.notLocalPlayer.${phase}`)
        }
    }
    const playerPart = isLocalPlayerTurn.value ? 'localPlayer' : 'notLocalPlayer'
    return t(`status.${playerPart}.${phase}`, { player: props.game.players[props.gameState.activePlayerIndex]?.name })
})

const canTrade = computed(() => {
    return isLocalPlayerTurn.value && props.gameState.phase == CatanGamePhase.PLAYER_TURN
})

function playerTradeOfferResult(result: boolean) {
    performAction<CatanTradeResponseAction>({
        type: 'CatanTradeResponseAction',
        accepted: result
    })
}

const tradeDialog = useTemplateRef('tradeDialog')

async function trade() {
    const deal = await tradeDialog.value?.open(props.playerPrivateState.resources, getPlayerPrices(props.gameState.field, localPlayer.value.userId))
    if (deal) {
        performAction<CatanTradeAction>({
            type: 'CatanTradeAction',
            deal: deal
        })
    }
}

const selectPlayesDialog = useTemplateRef('selectPlayesDialog')

async function hexClick(hex: CatanTerrainHex) {
    if (props.gameState && props.gameState.phase == CatanGamePhase.MOVE_ROBBER && isLocalPlayerTurn.value) {
        if (!Vector2D.equals(hex.position, props.gameState.field.robberPos)) {
            const intersects = findByCoords(getHexVerticesPositions(hex.position), intersectsByCoords.value)
            const players = distinct(intersects.flatMap(int => int.intersectionObjects)
                .filter(obj => obj.type == CatanIntersectionObjectType.SETTLEMENT ||
                    obj.type == CatanIntersectionObjectType.CITY)
                .map(obj => obj.playerId)
                .filter(playerId => playerId != localPlayer.value.userId)
                .map(playerId => props.game.players.find(pl => pl.userId == playerId)!),
                pl => pl.userId)


            let selectedPlayerId: string | undefined
            if (players.length == 0) {
                selectedPlayerId = undefined
            } else if (players.length == 1) {
                selectedPlayerId = players[0]?.userId
            } else {
                const dialogSelectedPlayers = await selectPlayesDialog.value?.open(players, false) as Player
                console.log("selected players", JSON.stringify(dialogSelectedPlayers))
                if (dialogSelectedPlayers) {
                    selectedPlayerId = dialogSelectedPlayers.userId
                } else {
                    return
                }
            }
            performAction<CatanMoveRobberAction>({
                type: 'CatanMoveRobberAction',
                position: hex.position,
                playerToRob: selectedPlayerId
            })
        }
    }
}

const selectedResorceCards = ref<CatanResources>(initResources({}))

function discardCards() {
    if (discardCardsEnabled) {
        performAction<CatanDiscardResourceCards>({
            type: 'CatanDiscardResourceCards',
            resources: selectedResorceCards.value
        })
        selectedResorceCards.value = initResources({})
    }
}

const needToDiscardCards = computed(() => {
    return props.playerPrivateState.discardCardsCount > 0
})

const discardCardsEnabled = computed(() => {
    const selectedCardsCount = recordValues(selectedResorceCards.value).reduce((a, c) => a + c, 0)
    return props.playerPrivateState.discardCardsCount == selectedCardsCount
})

const buildItemType = ref<CatanBuyItemType | undefined>()

interface EmbarkData {
    settlement: CatanIntersection | undefined,
    road: CatanRoad | undefined
}

const embarkData = ref<EmbarkData>({
    settlement: undefined,
    road: undefined
})

const buyItems = ref(getBuyItems())

const availableBuyItems = computed(() => getAvailableBuyItems(localPlayer.value.userId, props.gameState.field))

const buyMenuActive = ref(false)

const buyClick = () => {
    buildItemType.value = undefined
    buyMenuActive.value = !buyMenuActive.value
}

function buyItemClick(item: CatanBuyItem) {
    if (!canBuyItem(item)) {
        return
    }
    if (item.type == CatanBuyItemType.DEVELOPMENT_CARD) {
        performAction<CatanBuyDevelopmentCardAction>({ type: 'CatanBuyDevelopmentCardAction' })
    } else {
        buildItemType.value = item.type
    }
    buyMenuActive.value = false
}

function canBuyItem(item: CatanBuyItem): boolean {
    if (!canBuy.value) {
        return false
    }
    if (!availableBuyItems.value) {
        return false
    }
    const availableItemCount = availableBuyItems.value[item.type]
    return (availableItemCount == undefined || availableItemCount > 0) &&
        recordEntries(item.resources).every(([resourceType, resourceCount]) => {
            const playerResource = props.playerPrivateState.resources[resourceType]
            return playerResource >= resourceCount
        })
}

function endTurn() {
    if (!canEndTurn.value) {
        return
    }
    performAction<CatanEndTurnAction>({ type: 'CatanEndTurnAction' })
}

const canEndTurn = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.PLAYER_TURN) && isLocalPlayerTurn.value
})

const canBuy = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.PLAYER_TURN) && isLocalPlayerTurn.value
})

function getFlatResources(resources: CatanResources) {
    return recordEntries(resources).flatMap(([resourceType, resourceCount]) => rangeArray(resourceCount).map(() => resourceType))
}

const canRollDices = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.THROWING_DICE) && isLocalPlayerTurn.value && props.game.status == GameStatusEnum.STARTED
})

const diceContainerClass = computed(() => {
    return {
        'dice-container': true,
        'dices-highlight': canRollDices.value
    }
})

const allDiceValue = computed(() => {
    return props.gameState.dices.redDice + props.gameState.dices.yellowDice
})

const dices = computed<CatanDices>(() => {
    return props.gameState.dices
})

function rollDices() {
    if (!canRollDices.value) {
        return
    }
    performAction<CatanRollDicesAction>({
        type: 'CatanRollDicesAction'
    })
}

const canEmbark = computed(() => {
    return embarkData.value.road && embarkData.value.settlement
})

function embark() {
    performAction<CatanEmbarkAction>({
        type: 'CatanEmbarkAction',
        settlement: embarkData.value.settlement?.position!,
        road: embarkData.value.road?.position!
    })
    embarkData.value.settlement = undefined
    embarkData.value.road = undefined
}

function hasSettlemetOrCity(ins: CatanIntersection, playerId: String) {
    return ins.intersectionObjects.some(obj =>
        (obj.type == CatanIntersectionObjectType.SETTLEMENT ||
            obj.type == CatanIntersectionObjectType.CITY) &&
        obj.playerId == playerId

    )
}

function canBuildRoad(position: Vector2DLike): boolean {
    var intersections = findByCoords(getEdgeVerticesPositions(position), intersectsByCoords.value)
        .filter(ins => hasSettlemetOrCity(ins, localPlayer.value.userId))
    var roads = findByCoords(getEdgeNeighborhoodsPositions(position), roadsByCoords.value)
        .filter(road => road.playerId == localPlayer.value.userId)
    return intersections.length != 0 || roads.length != 0
}

function canEmbarkRoad(position: Vector2DLike): boolean {
    if (!embarkData.value.settlement) {
        return false
    }
    return getEdgeVerticesPositions(position).some(vert => Vector2D.equals(vert, embarkData.value.settlement?.position))
}

function roadOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (catanEmbarkPhases.includes(props.gameState.phase)) {
            let road = roadsByCoords.value.get(position)
            if (road) {
                if (road != embarkData.value.road) {
                    return
                }
                removeElement(props.gameState.field.roads, road)
                embarkData.value.road = undefined
                return
            }

            if (embarkData.value.road) {
                return
            }

            if (!canEmbarkRoad(position)) {
                return
            }

            road = {
                playerId: localPlayer.value.userId,
                position: position
            }

            props.gameState.field.roads.push(road)
            embarkData.value.road = road
        } else if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
            if (buildItemType.value == CatanBuyItemType.ROAD || freeBuilding.value) {
                let road = roadsByCoords.value.get(position)
                if (road) {
                    return
                }
                if (!canBuildRoad(position)) {
                    return
                }
                performAction<CatanBuildRoadAction>({
                    type: 'CatanBuildRoadAction',
                    position: position
                })
                buildItemType.value = undefined
            }
        }
    }
}


function intersectionNeighbourhoodsOcupated(position: Vector2DLike) {
    const neighborhoods = findByCoords(getVertexNeighborhoodsPositions(position), intersectsByCoords.value)
    return neighborhoods.some(neighborhood => neighborhood.intersectionObjects.length > 0)
}

function intersectionOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (catanEmbarkPhases.includes(props.gameState.phase)) {

            if (intersectionNeighbourhoodsOcupated(position)) {
                return
            }

            var intersection: CatanIntersection | undefined = intersectsByCoords.value.get(position)
            if (intersection) {
                if (intersection != embarkData.value.settlement) {
                    return
                }
                if (embarkData.value.road) {
                    if (getVertexEdgesPositions(position).some(pos => Vector2D.equals(pos, embarkData.value.road?.position))) {
                        removeElement(props.gameState.field.roads, embarkData.value.road)
                        embarkData.value.road = undefined
                    }
                }
                removeElement(props.gameState.field.intersections, intersection)
                embarkData.value.settlement = undefined
                return
            }

            if (embarkData.value.settlement) {
                return
            }

            const settlement = {
                playerId: localPlayer.value.userId,
                type: CatanIntersectionObjectType.SETTLEMENT
            }
            intersection = {
                position: position,
                intersectionObjects: [settlement]
            }

            props.gameState.field.intersections.push(intersection)
            embarkData.value.settlement = intersection
        } else if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
            if (buildItemType.value) {
                const intObjectType = buyItemToIntersectionObject(buildItemType.value)
                if (!intObjectType) {
                    return
                }

                if (!canBuildIntObject(intObjectType, position, localPlayer.value.userId)) {
                    return
                }

                performAction<CatanBuildIntObjectAction>({
                    type: 'CatanBuildIntObjectAction',
                    position: position,
                    objectType: intObjectType
                })
                buildItemType.value = undefined
            }
        }
    }
}

function canBuildIntObject(intObjectType: CatanIntersectionObjectType, position: Vector2DLike, playerId: string): boolean {
    if (intObjectType == CatanIntersectionObjectType.CITY) {
        const int = intersectsByCoords.value.get(position)
        if (!int) {
            return false
        }
        const hasSettelment = int.intersectionObjects.some(io => io.type == CatanIntersectionObjectType.SETTLEMENT && io.playerId == playerId)
        return hasSettelment
    }

    const neighborhoodInts = findByCoords(getVertexNeighborhoodsPositions(position), intersectsByCoords.value)
    const setType = [CatanIntersectionObjectType.CITY, CatanIntersectionObjectType.SETTLEMENT]
    if (intObjectType == CatanIntersectionObjectType.SETTLEMENT) {
        // check have settelment on same hex edge
        if (neighborhoodInts.some(nh => nh.intersectionObjects.some(io => setType.includes(io.type)))) {
            return false
        }
        const int = intersectsByCoords.value.get(position)
        if (int) {
            // check settelment already 
            const hasSettelmentOrCity = int.intersectionObjects.some(io => setType.includes(io.type))
            if (hasSettelmentOrCity) {
                return false
            }
        }
        const roads = findByCoords(getVertexEdgesPositions(position), roadsByCoords.value)

        if (!roads.some(road => road.playerId == playerId)) {
            return false
        }
    }

    return true
}

const showEmbarkButton = computed(() => {
    return isLocalPlayerTurn.value && catanEmbarkPhases.includes(props.gameState.phase)
})

const intersectsByCoords = computed(() => {
    return toCoordsArray(props.gameState.field.intersections)
})

const roadsByCoords = computed(() => {
    return toCoordsArray(props.gameState.field.roads)
})

const localPlayer = computed(() => {
    return props.game.players[props.localPlayerIndex]!
})

function performAction<T extends GameAction>(action: T) {
    emit('performAction', action)
}

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
})

const publicPlayerState = computed(() => {
    return props.gameState.playersStates[props.localPlayerIndex]!
})

const props = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameState: {
        type: Object as PropType<CatanPublicGameState>,
        required: true
    },
    playerPrivateState: {
        type: Object as PropType<CatanPlayerPrivateState>,
        required: true
    },
    localPlayerIndex: {
        type: Number,
        required: true
    }
})

</script>

<style scoped>
.dice-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: 8px;
}

@keyframes pulse-highlight {
    0% {
        box-shadow: inset 0px 0px 5px rgba(0, 0, 0, 0);
    }

    50% {
        box-shadow: inset 0px 0px 5px rgb(0, 250, 17);
    }

    100% {
        box-shadow: inset 0px 0px 5px rgb(0, 0, 0, 0);
    }
}

.dices-highlight {
    animation: pulse-highlight 1s infinite ease-in-out;
    cursor: pointer;
}

.hand-pointer {
    cursor: pointer;
}

.selected-card {
    border: 3px solid #28ee00;
}

.buy-item-dsabled {
    opacity: 0.5;
    cursor: default
}
</style>