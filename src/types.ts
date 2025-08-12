import type { Variable as TerraVariable } from "@nasa-terra/components/dist/components/browse-variables/browse-variables.types.js"
import { LatLng, LatLngBounds } from "leaflet";

export type Variable = TerraVariable

export enum SpatialAreaType {
    GLOBAL = 'global',
    COORDINATES = 'coordinates',
    BOUNDING_BOX = 'bounding_box',
}

export type SpatialArea =
    | { type: SpatialAreaType.GLOBAL }
    | { type: SpatialAreaType.COORDINATES; value:  LatLng }
    | { type: SpatialAreaType.BOUNDING_BOX; value: LatLngBounds }

export type DateTimeRange = {
    startDate: string | null
    endDate: string | null
}

export type TimeSeriesRequestHistoryItem = {
    id: string
    request: TimeSeriesRequest
    createdAt: string
}

export type TimeSeriesRequest = {
    variable: Variable
    spatialArea: SpatialArea
    dateTimeRange: DateTimeRange
}

// there are more properties not typed here, see https://urs.earthdata.nasa.gov/documentation/for_integrators/api_documentation#/api/users/%7Buserid%7D
export type User = {
    uid: string
    first_name: string
    last_name: string
    email_address: string
}
