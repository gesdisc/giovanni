import { TimeSeriesData } from '@nasa-terra/components/dist/components/time-series/time-series.types.js'
import type { DateTimeRange, SpatialArea, Variable } from "../types"

export interface TimeSeriesService {
    getData(request: TimeSeriesRequest): Promise<TimeSeriesData>
}

export type TimeSeriesRequest = {
    variable: Variable
    spatialArea: SpatialArea
    dateTimeRange: DateTimeRange
}
