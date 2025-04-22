import { computed, signal } from '@preact/signals-core'
import { DateTimeRange, SpatialArea, Variable } from './types'

export const variables = signal<Variable[]>([])
export const spatialArea = signal<SpatialArea | null>(null) // TODO: can we set default spatial area that's not null?
export const dateTimeRange = signal<DateTimeRange | null>(null) // TODO: can we set default date/time range that's not null?

export const userCanGeneratePlot = computed(() => {
    return variables.value.length > 0 &&
        spatialArea.value !== null &&
        dateTimeRange.value !== null
})
