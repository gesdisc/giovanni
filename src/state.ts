import { computed, signal } from '@preact/signals-core'
import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequestHistoryItem, UserState } from './types'
import { VariableComponent } from './components/variable'
import { getValidDateRangeFromVariables } from './utilities/date'
import { getOptionsFromLocalStorage } from './utilities/localstorage'
import { getOptionsFromCurrentUrl } from './utilities/url'

const existingOptions = getOptionsFromLocalStorage() || getOptionsFromCurrentUrl()

export const userState = signal<UserState>({ userChecked: false, user: null })
export const userHistory = signal<TimeSeriesRequestHistoryItem[]>([])
export const plotType = signal<'map' | 'plot'>(existingOptions?.plotType ?? 'plot')
export const variables = signal<VariableComponent[]>([])
export const spatialArea = signal<SpatialArea | null>(existingOptions?.spatialArea ?? null)
export const dateTimeRange = signal<DateTimeRange | null>(existingOptions?.dateTimeRange ?? null)
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

export const configuredUrl = computed(() => {
    const url = new URL(window.location.href)

    // clear out existing values
    url.searchParams.delete('lat')
    url.searchParams.delete('lng')
    url.searchParams.delete('bounds')
    url.searchParams.delete('startDate')
    url.searchParams.delete('endDate')
    url.searchParams.delete('variable')
    url.searchParams.delete('type')

    if (plotType.value && plotType.value !== 'plot') {
        url.searchParams.set('type', plotType.value ?? 'plot')
    }

    if (spatialArea.value?.type === SpatialAreaType.COORDINATES) {
        url.searchParams.set('lat', spatialArea.value.value.lat)
        url.searchParams.set('lng', spatialArea.value.value.lng)
    }

    if (spatialArea.value?.type === SpatialAreaType.BOUNDING_BOX) {
        url.searchParams.set('bounds', `${spatialArea.value.value.west},${spatialArea.value.value.south},${spatialArea.value.value.east},${spatialArea.value.value.north}`)
    }

    if (dateTimeRange.value?.startDate && dateTimeRange.value?.endDate) {
        url.searchParams.set('startDate', dateTimeRange.value.startDate)
        url.searchParams.set('endDate', dateTimeRange.value.endDate)
    }

    variables.value?.forEach(variable => url.searchParams.append('variable', variable.variable.dataFieldId))

    return url
})
