import { computed, signal } from '@preact/signals-core'
import { DateTimeRange, SpatialArea, TimeSeriesRequestHistoryItem, UserState } from './types'
import { VariableComponent } from './components/variable'
import { getValidDateRangeFromVariables } from './utilities/date'

export const userState = signal<UserState>({ userChecked: false, user: null })
export const userHistory = signal<TimeSeriesRequestHistoryItem[]>([])
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
        userState.value.user !== null && // User must be logged in
        variables.value.length > 0 &&
        spatialArea.value !== null &&
        hasValidDateTimeRange.value
    )
})

export const needsLogin = computed(() => {
    if (localStorage.getItem('terra-token') && !userState.value.userChecked) {
        // if the user has a token, assume they are logged in, we'll check in the background and update the user state if they aren't
        return false
    }

    // if the user does not have a "terra-token" in their local storage, require login
    // if they do, but don't have a user, meaning the token is invalid, require login
    return !localStorage.getItem('terra-token') || !userState.value.user
})

export const validDateTimeRange = computed(() => {
    return getValidDateRangeFromVariables(variables.value.map(v => v.variable))
})
