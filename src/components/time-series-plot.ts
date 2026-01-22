import {
    TerraTimeSeries,
    TerraTimeSeriesDataChangeEvent,
} from '@nasa-terra/components'
import {
    DateTimeRange,
    SpatialArea,
    SpatialAreaType,
    TimeSeriesRequest,
} from '../types'
import { storeTimeSeriesRequestInHistory, updateHistoryItemThumbnail, getUniqueIdForTimeSeriesRequest } from '../history'
import { loadingHistoryIds } from '../state'

interface TimeSeriesPlotRequest extends TimeSeriesRequest {
    variableLongName: string
    fromHistory?: boolean
    historyId?: string | null
}

export class TimeSeriesPlotComponent {
    element: HTMLElement
    #plotEl: TerraTimeSeries
    #request: TimeSeriesPlotRequest
    #hasCompleted: boolean = false
    #historyId: string | null = null

    constructor(request: TimeSeriesPlotRequest) {
        // If loading from history, use the provided history ID; otherwise generate a new one
        this.#historyId = request.historyId || null
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-series')

        this.#plotEl.setAttribute('disable-auto-fetch', 'true')

        this.element.appendChild(this.#plotEl)

        this.#request = request

        this.#plotEl.variableEntryId = request.variable.dataFieldId
        this.updateDateTimeRange(request.dateTimeRange)
        this.updateSpatialArea(request.spatialArea)

        if (!request.fromHistory) {
            // Call async function but don't block - errors will be logged
            this.#addToHistoryImmediately().catch(error => {
                console.error('Error adding time series plot to history:', error)
            })
        }

        document.addEventListener(
            'terra-time-series-data-change',
            this.#handleDataChange.bind(this)
        )
    }

    destroy() {
        document.removeEventListener(
            'terra-time-series-data-change',
            this.#handleDataChange.bind(this)
        )

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

    async #addToHistoryImmediately() {
        // Generate a unique ID for this history item
        this.#historyId = getUniqueIdForTimeSeriesRequest({
            variable: this.#request.variable,
            spatialArea: this.#request.spatialArea,
            dateTimeRange: this.#request.dateTimeRange,
        })

        // Track this item as loading
        loadingHistoryIds.value = new Set([...loadingHistoryIds.value, this.#historyId])

        // Add to history without thumbnail (will show placeholder)
        await storeTimeSeriesRequestInHistory(
            {
                variable: this.#request.variable,
                spatialArea: this.#request.spatialArea,
                dateTimeRange: this.#request.dateTimeRange,
                thumbnail: undefined,
            },
            'plot',
            this.#historyId
        )
    }

    async #handlePlotComplete(_e: TerraTimeSeriesDataChangeEvent) {
        // If we don't have a history ID, we can't update the thumbnail
        // This can happen if loading from history but no history ID was provided
        if (!this.#historyId) {
            // If not from history, this is an error
            if (!this.#request.fromHistory) {
                console.warn('No history ID found when trying to update thumbnail')
            }
            return
        }

        // Update thumbnail even if loaded from history (in case cache was empty and new request was made)

        let thumbnail: Blob | undefined

        try {
            // first we'll attempt to get a screenshot of the plot
            const plot = this.#plotEl.shadowRoot
                ?.querySelector('terra-plot')
                ?.shadowRoot?.querySelector('.js-plotly-plot') as HTMLElement

            // Only capture thumbnail if plot element exists and has content
            if (plot && plot.offsetWidth > 0 && plot.offsetHeight > 0) {
                thumbnail = await this.#getThumbnailBlob(plot)
            } else {
                console.log('Plot not yet rendered, skipping thumbnail capture')
            }
        } catch (e) {
            console.error('Error getting thumbnail', e)
        }

        // Remove from loading set (no longer loading)
        const newLoadingIds = new Set(loadingHistoryIds.value)
        newLoadingIds.delete(this.#historyId)
        loadingHistoryIds.value = newLoadingIds

        // Only update thumbnail if we have a valid thumbnail blob (not undefined)
        // This ensures we don't store placeholder or loading thumbnails
        if (thumbnail instanceof Blob && thumbnail.size > 0) {
            await updateHistoryItemThumbnail(this.#historyId, thumbnail)
        } else {
            // If no valid thumbnail, keep thumbnail as undefined
            await updateHistoryItemThumbnail(this.#historyId, undefined)
        }
    }

    async #getThumbnailBlob(
        plotElement: HTMLElement,
        thumbWidth = 200,
        thumbHeight = 200
    ) {
        // Render a png from Plotly at a large size so it looks good
        const bigDataUrl = await (window as any).Plotly?.toImage(plotElement, {
            format: 'jpeg',
            width: 500,
            height: 500,
        })

        // Downscale the png to the desired size
        const img = new Image()
        img.src = bigDataUrl
        await img.decode()

        const canvas = document.createElement('canvas')
        canvas.width = thumbWidth
        canvas.height = thumbHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

        return await new Promise<Blob>(resolve =>
            canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.5)
        )
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
