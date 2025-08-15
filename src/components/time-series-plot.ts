import { TerraTimeSeries, TerraTimeSeriesDataChangeEvent } from '@nasa-terra/components'
import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequest } from '../types'
import { storeTimeSeriesRequestInHistory } from '../history'
import Plotly from 'plotly.js-dist-min'

interface TimeSeriesPlotRequest extends TimeSeriesRequest {
    variableLongName: string
    fromHistory?: boolean
}

export class TimeSeriesPlotComponent {
    element: HTMLElement
    #plotEl: TerraTimeSeries
    #request: TimeSeriesPlotRequest
    #hasCompleted: boolean = false

    constructor(request: TimeSeriesPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-series')

        this.element.appendChild(this.#plotEl)
        
        this.#request = request
        
        this.#plotEl.variableEntryId = request.variable.dataFieldId
        this.updateDateTimeRange(request.dateTimeRange)
        this.updateSpatialArea(request.spatialArea)

        document.addEventListener('terra-time-series-data-change', this.#handleDataChange.bind(this))
    }

    destroy() {
        document.removeEventListener('terra-time-series-data-change', this.#handleDataChange.bind(this))
        
        this.element.parentElement?.removeChild(this.element)
    }

    #handleDataChange(e: TerraTimeSeriesDataChangeEvent) {
        if (e.target !== this.#plotEl) {
            return
        }
        
        
        if (this.#hasCompleted) {
            return
        }

        this.#hasCompleted = true
        
        setTimeout(async () => {
            // delay a second to give the plot time to render
            await this.#handlePlotComplete(e)
        }, 1000)
    }

    async #handlePlotComplete(e: TerraTimeSeriesDataChangeEvent) {
        // Skip saving to history if this plot was loaded from history
        if (this.#request.fromHistory) {
            return
        }

        let thumbnail: Blob | undefined

        try {
            // first we'll attempt to get a screenshot of the plot
            const plot = this.#plotEl.shadowRoot?.querySelector('terra-plot')?.shadowRoot?.querySelector('.js-plotly-plot') as HTMLElement

            thumbnail = await this.#getThumbnailBlob(plot)
        } catch (e) {
            console.error('Error getting thumbnail', e)
        }

        await storeTimeSeriesRequestInHistory({
            variable: this.#request.variable,
            spatialArea: this.#request.spatialArea,
            dateTimeRange: this.#request.dateTimeRange,
            thumbnail,
        })
    }

    async #getThumbnailBlob(plotElement: HTMLElement, thumbWidth = 200, thumbHeight = 200) {
        // Render a png from Plotly at a large size so it looks good
        const bigDataUrl = await Plotly.toImage(plotElement, {
          format: 'jpeg',
          width: 500,
          height: 500
        });
      
        // Downscale the png to the desired size
        const img = new Image();
        img.src = bigDataUrl;
        await img.decode();
      
        const canvas = document.createElement('canvas');
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      
        return await new Promise<Blob>((resolve) =>
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.5)
        );
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

}
