import desertImg from '../assets/terrain/DESERT.webp'
import fieldsImg from '../assets/terrain/FIELDS.webp'
import forestImg from '../assets/terrain/FOREST.webp'
import hillsImg from '../assets/terrain/HILLS.webp'
import mountainsImg from '../assets/terrain/MOUNTAINS.webp'
import pastureImg from '../assets/terrain/PASTURE.webp'

import portImg from '../assets/port.webp'
import robberImg from '../assets/robber.webp'

import bricsImg from '../assets/resources/bricks.webp'
import oreImg from '../assets/resources/ore.webp'
import sheepImg from '../assets/resources/sheep.webp'
import wheatImg from '../assets/resources/wheat.webp'
import woodImg from '../assets/resources/wood.webp'

import bricsCardImg from '../assets/resource-cards/bricks.webp'
import oreCardImg from '../assets/resource-cards/ore.webp'
import sheepCardImg from '../assets/resource-cards/sheep.webp'
import wheatCardImg from '../assets/resource-cards/wheat.webp'
import woodCardImg from '../assets/resource-cards/wood.webp'

import { CatanTerrainHexType } from "catan-back"
import { CatanDevelopmentCardType, CatanHarbourType, CatanResourceType, CatanSpecialCard } from 'catan-back'

export const portImage = portImg
export const robberImage = robberImg

import buidRoadsImg from '../assets/development-cards/build-roads.webp'
import chapelImg from '../assets/development-cards/chapel.webp'
import greatHallImg from '../assets/development-cards/great-hall.webp'
import kinghtImg from '../assets/development-cards/knight.webp'
import libraryImg from '../assets/development-cards/library.webp'
import marketImg from '../assets/development-cards/market.webp'
import monopolyImg from '../assets/development-cards/monopoly.webp'
import universityImg from '../assets/development-cards/university.webp'
import yearOfPlentyImg from '../assets/development-cards/year-of-plenty.webp'

export const knightImage = kinghtImg

import biggestArmyImg from '../assets/special-cards/biggest-army.webp'
import longestRoadImg from '../assets/special-cards/longest-road.webp'

export const specialCardsImgs: Record<CatanSpecialCard, string> = {
    [CatanSpecialCard.BIGGEST_ARMY]: biggestArmyImg,
    [CatanSpecialCard.LONGEST_ROAD]: longestRoadImg
}

export const developmentCardsImgs: Record<CatanDevelopmentCardType, string> = {
    [CatanDevelopmentCardType.KNIGNT]: kinghtImg,
    [CatanDevelopmentCardType.BUILD_ROADS]: buidRoadsImg,
    [CatanDevelopmentCardType.MONOPOLY]: monopolyImg,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: yearOfPlentyImg,
    [CatanDevelopmentCardType.CHAPEL]: chapelImg,
    [CatanDevelopmentCardType.GREAT_HALL]: greatHallImg,
    [CatanDevelopmentCardType.LIBRARY]: libraryImg,
    [CatanDevelopmentCardType.MARKET]: marketImg,
    [CatanDevelopmentCardType.UNIVERSITY]: universityImg
}

export const resourceCardsImg: Record<CatanResourceType, string> = {
    [CatanResourceType.CLAY]: bricsCardImg,
    [CatanResourceType.GRAIN]: wheatCardImg,
    [CatanResourceType.ORE]: oreCardImg,
    [CatanResourceType.WOOD]: woodCardImg,
    [CatanResourceType.WOOL]: sheepCardImg
}

export const resourcesImages: Record<CatanResourceType, string> = {
    [CatanHarbourType.CLAY]: bricsImg,
    [CatanHarbourType.ORE]: oreImg,
    [CatanHarbourType.WOOL]: sheepImg,
    [CatanHarbourType.GRAIN]: wheatImg,
    [CatanHarbourType.WOOD]: woodImg,
}

export const terrainImages = [
    {
        type: CatanTerrainHexType.DESERT,
        img: desertImg
    },
    {
        type: CatanTerrainHexType.FIELDS,
        img: fieldsImg
    },
    {
        type: CatanTerrainHexType.FOREST,
        img: forestImg
    },
    {
        type: CatanTerrainHexType.HILLS,
        img: hillsImg
    },
    {
        type: CatanTerrainHexType.MOUNTAINS,
        img: mountainsImg
    },
    {
        type: CatanTerrainHexType.PASTURE,
        img: pastureImg
    },
]

export const harbourResourcesImages = new Map<CatanHarbourType, string>([
    [CatanHarbourType.CLAY, bricsImg],
    [CatanHarbourType.ORE, oreImg],
    [CatanHarbourType.WOOL, sheepImg],
    [CatanHarbourType.GRAIN, wheatImg],
    [CatanHarbourType.WOOD, woodImg],
])
