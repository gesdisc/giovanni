import { PlotType } from "../components/plot-type-selector"
import { DateTimeRange, Options, SpatialArea, SpatialAreaType } from "../types"

export function getOptionsFromCurrentUrl(): Options {
    return {
        plotType: getPlotTypeFromUrl(window.location.href),
        spatialArea: getSpatialAreaFromUrl(window.location.href),
        dateTimeRange: getDateTimeRangeFromUrl(window.location.href),
        variables: getVariablesFromUrl(window.location.href),
        canGeneratePlots: false,
    }
}

export function getVariablesFromUrl(urlString: string): string[] {
    return new URL(urlString).searchParams.getAll('variable')
}

export function getPlotTypeFromUrl(urlString: string): PlotType {
    const url = new URL(urlString)

    switch (url.searchParams.get('type')) {
        case 'map':
            return 'map'
        default:
            return 'plot'
    }
}

export function getSpatialAreaFromUrl(urlString: string): SpatialArea | null {
    const url = new URL(urlString)
    const lat = url.searchParams.get('lat')
    const lng = url.searchParams.get('lng')
    const bounds = url.searchParams.get('bounds')?.split(',')

    if (bounds && bounds.length >= 4) {
        return {
            type: SpatialAreaType.BOUNDING_BOX,
            value: {
                west: bounds[0],
                south: bounds[1],
                east: bounds[2],
                north: bounds[3],
            }
        }
    }

    if (lat && lng) {
        return {
            type: SpatialAreaType.COORDINATES,
            value: {
                lat,
                lng,
            }
        }
    }

    return null
}

export function getDateTimeRangeFromUrl(urlString: string): DateTimeRange | null {
    const url = new URL(urlString)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    
    if (startDate && endDate) {
        return {
            startDate,
            endDate,
        }
    }

    return null
}