import { computed, effect, signal } from '@preact/signals-core'
import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequestHistoryItem, UserState } from './types'
import { VariableComponent } from './components/variable'
import { getValidDateRangeFromVariables, getLastNAvailableDays } from './utilities/date'
import { getDefaultSpatialAreaFromVariables, isGlobalSpatialArea } from './utilities/spatial'
import { getOptionsFromLocalStorage } from './utilities/localstorage'
import { getOptionsFromCurrentUrl } from './utilities/url'

const existingOptions = getOptionsFromLocalStorage() || getOptionsFromCurrentUrl()

export const userState = signal<UserState>({ userChecked: false, user: null })
export const userHistory = signal<TimeSeriesRequestHistoryItem[]>([])
export const loadingHistoryIds = signal<Set<string>>(new Set())
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

// Computed signal for effective spatial area (user-selected or default from variables)
export const effectiveSpatialArea = computed(() => {
    if (spatialArea.value !== null) {
        return spatialArea.value
    }
    
    // If no spatial area is selected, use default from variables
    if (variables.value.length > 0) {
        return getDefaultSpatialAreaFromVariables(variables.value.map(v => v.variable))
    }
    
    // Fallback to global if no variables
    return {
        type: SpatialAreaType.BOUNDING_BOX,
        value: {
            west: '-180',
            south: '-90',
            east: '180',
            north: '90',
        },
    }
})

export const canGeneratePlots = computed(() => {
    return (
        variables.value.length > 0 &&
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

// Auto-set default spatial area when variables change and no spatial area is set
// Only auto-set if the default is NOT global (leave it null if global)
effect(() => {
    if (spatialArea.value === null && variables.value.length > 0) {
        const defaultArea = getDefaultSpatialAreaFromVariables(variables.value.map(v => v.variable))
        // Only auto-set if it's not global - leave it null if global
        if (!isGlobalSpatialArea(defaultArea)) {
            spatialArea.value = defaultArea
        }
    }
})

// Auto-set default date range to last 7 available days when variables are selected and no date range is set
effect(() => {
    // Only set default if date range is null or incomplete
    const hasNoDateRange = dateTimeRange.value === null || 
        !dateTimeRange.value.startDate || 
        !dateTimeRange.value.endDate
    
    if (hasNoDateRange && variables.value.length > 0) {
        const validRange = validDateTimeRange.value
        if (validRange.maxDate) {
            const last7Days = getLastNAvailableDays(validRange.minDate, validRange.maxDate, 7)
            if (last7Days) {
                dateTimeRange.value = {
                    startDate: last7Days.startDate,
                    endDate: last7Days.endDate,
                }
            }
        }
    }
})

export const configuredUrl = computed(() => {
    const url = new URL(window.location.href)
    const effectiveArea = effectiveSpatialArea.value

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

    if (effectiveArea.type === SpatialAreaType.COORDINATES) {
        url.searchParams.set('lat', (effectiveArea.value as { lat: string; lng: string }).lat)
        url.searchParams.set('lng', (effectiveArea.value as { lat: string; lng: string }).lng)
    } else if (effectiveArea.type === SpatialAreaType.BOUNDING_BOX) {
        const bbox = effectiveArea.value as { west: string; south: string; east: string; north: string }
        url.searchParams.set('bounds', `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`)
    }

    if (dateTimeRange.value?.startDate && dateTimeRange.value?.endDate) {
        url.searchParams.set('startDate', dateTimeRange.value.startDate)
        url.searchParams.set('endDate', dateTimeRange.value.endDate)
    }

    variables.value?.forEach(variable => url.searchParams.append('variable', variable.variable.dataFieldId))

    return url
})
