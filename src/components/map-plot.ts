import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequest } from '../types'

interface MapPlotRequest extends TimeSeriesRequest {
    variableLongName: string
}

export class MapPlotComponent {
    element: HTMLElement
    #plotEl: any


    constructor(request: MapPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-average-map') as any

        this.element.appendChild(this.#plotEl)

        const { collectionId, variableShortName } = this.#getCollectionAndVariable(
            request.variable.dataFieldId,
            request.variable.dataFieldShortName
        )

        this.#plotEl.applicationId = 'giovanni-ui'
        this.#plotEl.collection = collectionId
        this.#plotEl.variable = variableShortName
        this.updateDateTimeRange(request.dateTimeRange)
        this.updateSpatialArea(request.spatialArea)
    }

    destroy() {
        this.element.parentElement?.removeChild(this.element)
    }

    async updateDateTimeRange(newDateTimeRange: DateTimeRange) {
        this.#plotEl.startDate = newDateTimeRange.startDate!
        this.#plotEl.endDate = newDateTimeRange.endDate!
    }

    async updateSpatialArea(newSpatialArea: SpatialArea) {
        if (newSpatialArea.type == SpatialAreaType.BOUNDING_BOX) {
            const coordinates = [
                newSpatialArea.value.west,
                newSpatialArea.value.south,
                newSpatialArea.value.east,
                newSpatialArea.value.north,
            ]

            this.#plotEl.location = coordinates.join(',')
        } else if (newSpatialArea.type == SpatialAreaType.COORDINATES) {
            const { lat, lng } = newSpatialArea.value

            this.#plotEl.location = `${lat},${lng}`
        } else {
            // TODO: support shapes
            console.error('Unsupported spatial area ', newSpatialArea)
        }
    }

    #getCollectionAndVariable(dataFieldId: string, dataFieldShortName?: string) {
        // Prefer splitting on the last underscore to get collection and variable parts
        const lastUnderscoreIndex = dataFieldId.lastIndexOf('_')
        if (lastUnderscoreIndex > -1) {
            const collectionId = dataFieldId.substring(0, lastUnderscoreIndex)
            const variableShortName = dataFieldId.substring(lastUnderscoreIndex + 1)
            return { collectionId, variableShortName }
        }

        // Fallback: if short name is provided and the id ends with `_${shortName}`
        if (dataFieldShortName && dataFieldId.endsWith(`_${dataFieldShortName}`)) {
            const collectionId = dataFieldId.slice(0, -1 * (dataFieldShortName.length + 1))
            return { collectionId, variableShortName: dataFieldShortName }
        }

        // As a last resort, use the entire id as collection and provided short name as variable
        return { collectionId: dataFieldId, variableShortName: dataFieldShortName || '' }
    }
}
