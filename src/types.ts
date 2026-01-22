import type { Variable as TerraVariable } from "@nasa-terra/components/dist/components/browse-variables/browse-variables.types.js"

export type Variable = TerraVariable

export enum SpatialAreaType {
    GLOBAL = 'global',
    COORDINATES = 'coordinates',
    BOUNDING_BOX = 'bounding_box',
}

export type SpatialArea =
    | { type: SpatialAreaType.GLOBAL }
    | { type: SpatialAreaType.COORDINATES; value:  { lat: string, lng: string } }
    | { type: SpatialAreaType.BOUNDING_BOX; value: { west: string, south: string, east: string, north: string } }

export type DateTimeRange = {
    startDate: string | null
    endDate: string | null
}

export type TimeSeriesRequestHistoryItem = {
    id: string
    request: TimeSeriesRequest
    createdAt: string
    plotType?: 'map' | 'plot'
}

export type TimeSeriesRequest = {
    variable: Variable
    spatialArea: SpatialArea
    dateTimeRange: DateTimeRange
    thumbnail?: Blob
    colorMapName?: string
    opacity?: number
}

export type UserState = {
    userChecked: boolean
    user: User | null | undefined
}

// there are more properties not typed here, see https://urs.earthdata.nasa.gov/documentation/for_integrators/api_documentation#/api/users/%7Buserid%7D
export type User = {
    uid: string
    first_name: string
    last_name: string
    email_address: string
}

export type Options = {
    plotType: 'map' | 'plot'
    variables: string[]
    spatialArea: SpatialArea | null
    dateTimeRange: DateTimeRange | null
    canGeneratePlots: boolean
}
