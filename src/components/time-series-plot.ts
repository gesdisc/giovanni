import { TerraTimeSeries } from '@nasa-terra/components'
import { TimeSeriesRequest } from '../services/types'
import { DateTimeRange, SpatialArea, SpatialAreaType } from '../types'

interface TimeSeriesPlotRequest extends TimeSeriesRequest {
    variableLongName: string
}

export class TimeSeriesPlotComponent {
    element: HTMLElement
    #plotEl: TerraTimeSeries

    constructor(request: TimeSeriesPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-series')
        
        this.element.appendChild(this.#plotEl)
        
        this.#plotEl.variableEntryId = request.variable.dataFieldId
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
        if (newSpatialArea.type == SpatialAreaType.COORDINATES) {
            const { lat, lng } = newSpatialArea.value

            this.#plotEl.location = `${lat},${lng}`
        } else {
            // TODO: support bounding box and shapes
            console.error('Unsupported spatial area ', newSpatialArea)
        }
    }

}
