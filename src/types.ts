import { EventObject } from 'xstate'

export type Variable = string

export type SpatialArea = {
    type: 'global' | 'region' | 'coordinates'
    value: string | [number, number, number, number]
}

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
