import type { Variable as TerraVariable } from "@nasa-terra/components/dist/components/browse-variables/browse-variables.types.js"

export type Variable = TerraVariable

export enum SpatialAreaType {
    GLOBAL = 'global',
    COORDINATES = 'coordinates',
    BOUNDING_BOX = 'bounding_box',
}

export type LatLng = {
    lat: number
    lng: number
}

export type SpatialArea =
    | { type: SpatialAreaType.GLOBAL }
    | { type: SpatialAreaType.COORDINATES; value: LatLng }
    | { type: SpatialAreaType.BOUNDING_BOX; value: [number, number, number, number] }

export type DateTimeRange = {
    startDate: string
    endDate: string
}
