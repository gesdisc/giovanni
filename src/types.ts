import { EventObject } from 'xstate'

export type Variable = string

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

export type AppContext = {
    variables: Variable[]
    spatialArea: SpatialArea | null
    dateTimeRange: DateTimeRange | null
}

export enum AppActions {
    SELECT_VARIABLES = 'SELECT_VARIABLES',
    SELECT_SPATIAL_AREA = 'SELECT_SPATIAL_AREA',
    SELECT_DATETIME_RANGE = 'SELECT_DATETIME_RANGE',
    GENERATE_PLOT = 'GENERATE_PLOT',
}

export type AppEvents = EventObject &
    (
        | { type: AppActions.SELECT_VARIABLES; variables: Variable[] }
        | { type: AppActions.SELECT_SPATIAL_AREA; spatialArea: SpatialArea }
        | { type: AppActions.SELECT_DATETIME_RANGE; dateTimeRange: DateTimeRange }
        | { type: AppActions.GENERATE_PLOT }
    )
