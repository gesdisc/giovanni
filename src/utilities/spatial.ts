import { Variable } from '../types'
import { SpatialArea, SpatialAreaType } from '../types'

/**
 * Get the default spatial area from a list of variables.
 *
 * Given that each variable has a different valid spatial area (dataProductWest, North, South, East),
 * we need to find the intersection (minimum valid area) that is valid for all variables.
 * If the intersection is smaller than the global bounding box (-180, -90, 180, 90), use it.
 * Otherwise, use the global bounding box.
 */
export function getDefaultSpatialAreaFromVariables(variables: Variable[]): SpatialArea {
    // Global bounding box
    const GLOBAL_WEST = -180
    const GLOBAL_SOUTH = -90
    const GLOBAL_EAST = 180
    const GLOBAL_NORTH = 90

    if (variables.length === 0) {
        return {
            type: SpatialAreaType.BOUNDING_BOX,
            value: {
                west: GLOBAL_WEST.toString(),
                south: GLOBAL_SOUTH.toString(),
                east: GLOBAL_EAST.toString(),
                north: GLOBAL_NORTH.toString(),
            },
        }
    }

    // Find the intersection of all variable spatial bounds
    // The intersection is the maximum west, maximum south, minimum east, minimum north
    const intersection = variables.reduce(
        (acc, current) => {
            return {
                west: Math.max(acc.west, current.dataProductWest),
                south: Math.max(acc.south, current.dataProductSouth),
                east: Math.min(acc.east, current.dataProductEast),
                north: Math.min(acc.north, current.dataProductNorth),
            }
        },
        {
            west: variables[0].dataProductWest,
            south: variables[0].dataProductSouth,
            east: variables[0].dataProductEast,
            north: variables[0].dataProductNorth,
        }
    )

    // Check if intersection is valid (west < east, south < north)
    if (intersection.west >= intersection.east || intersection.south >= intersection.north) {
        // Invalid intersection, use global
        return {
            type: SpatialAreaType.BOUNDING_BOX,
            value: {
                west: GLOBAL_WEST.toString(),
                south: GLOBAL_SOUTH.toString(),
                east: GLOBAL_EAST.toString(),
                north: GLOBAL_NORTH.toString(),
            },
        }
    }

    // Check if intersection is smaller than global (i.e., more restrictive)
    const intersectionArea = (intersection.east - intersection.west) * (intersection.north - intersection.south)
    const globalArea = (GLOBAL_EAST - GLOBAL_WEST) * (GLOBAL_NORTH - GLOBAL_SOUTH)

    // If intersection is smaller (more restrictive) than global, use it
    if (intersectionArea < globalArea) {
        return {
            type: SpatialAreaType.BOUNDING_BOX,
            value: {
                west: intersection.west.toFixed(4),
                south: intersection.south.toFixed(4),
                east: intersection.east.toFixed(4),
                north: intersection.north.toFixed(4),
            },
        }
    }

    // Otherwise, use global
    return {
        type: SpatialAreaType.BOUNDING_BOX,
        value: {
            west: GLOBAL_WEST.toString(),
            south: GLOBAL_SOUTH.toString(),
            east: GLOBAL_EAST.toString(),
            north: GLOBAL_NORTH.toString(),
        },
    }
}

/**
 * Check if a spatial area is the global bounding box
 */
export function isGlobalSpatialArea(area: SpatialArea): boolean {
    if (area.type !== SpatialAreaType.BOUNDING_BOX) {
        return false
    }
    
    const GLOBAL_WEST = '-180'
    const GLOBAL_SOUTH = '-90'
    const GLOBAL_EAST = '180'
    const GLOBAL_NORTH = '90'
    
    return (
        area.value.west === GLOBAL_WEST &&
        area.value.south === GLOBAL_SOUTH &&
        area.value.east === GLOBAL_EAST &&
        area.value.north === GLOBAL_NORTH
    )
}

