import { computed, signal } from '@preact/signals-core'
import { DateTimeRange, SpatialArea } from './types'
import { VariableComponent } from './components/variable'

export const variables = signal<VariableComponent[]>([])
export const spatialArea = signal<SpatialArea | null>(null) // TODO: can we set default spatial area that's not null?
export const dateTimeRange = signal<DateTimeRange | null>(null) // TODO: can we set default date/time range that's not null?
export const hasValidDateTimeRange = computed(() => {
    return (
        dateTimeRange.value !== null &&
        typeof dateTimeRange.value.startDate !== 'undefined' &&
        typeof dateTimeRange.value.endDate !== 'undefined'
    )
})

export const canGeneratePlots = computed(() => {
    return (
        variables.value.length > 0 &&
        spatialArea.value !== null &&
        hasValidDateTimeRange.value
    )
})
