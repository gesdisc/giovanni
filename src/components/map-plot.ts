import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequest } from '../types'
import { storeTimeSeriesRequestInHistory, updateHistoryItemThumbnail, getUniqueIdForTimeSeriesRequest } from '../history'
import { loadingHistoryIds } from '../state'

interface MapPlotRequest extends TimeSeriesRequest {
    variableLongName: string
    fromHistory?: boolean
}

export class MapPlotComponent {
    element: HTMLElement
    #plotEl: any
    #request: MapPlotRequest
    #historyId: string | null = null


    constructor(request: MapPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-average-map') as any

        this.element.appendChild(this.#plotEl)

        this.#request = request

        const { collectionId, variableShortName } = this.#getCollectionAndVariable(
            request.variable.dataFieldId,
            request.variable.dataFieldShortName
        )

        this.#plotEl.collection = collectionId
        this.#plotEl.variable = variableShortName
        this.updateDateTimeRange(request.dateTimeRange)
        this.updateSpatialArea(request.spatialArea)

        if (!request.fromHistory) {
            this.#addToHistoryImmediately()
        }

        document.addEventListener(
            'terra-time-average-map-data-change',
            this.#handleDataChange.bind(this)
        )
    }

    destroy() {
        document.removeEventListener(
            'terra-time-average-map-data-change',
            this.#handleDataChange.bind(this)
        )

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
            'map',
            this.#historyId
        )
    }

    async #handleDataChange(e: CustomEvent) {
        console.log('data change event', e)

        if (e.target !== this.#plotEl) {
            console.log('data change event target is not this plot')
            return
        }

        // Skip updating thumbnail if this plot was loaded from history
        if (this.#request.fromHistory) {
            console.log('data change event skipping saving to history')
            return
        }

        // If we don't have a history ID, something went wrong
        if (!this.#historyId) {
            console.warn('No history ID found when trying to update thumbnail')
            return
        }

        // Wait a bit for the map to render, then capture the canvas
        setTimeout(async () => {
            let thumbnail: Blob | undefined

            try {
                // Look for canvas elements in the shadow DOM
                const canvas = this.#plotEl.shadowRoot?.querySelector('canvas') as HTMLCanvasElement
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    console.log('Found canvas, capturing thumbnail')
                    thumbnail = await this.#getCanvasThumbnail(canvas)
                } else {
                    console.log('No canvas found in shadow DOM or canvas not yet rendered')
                }
            } catch (error) {
                console.error('Error capturing thumbnail:', error)
            }

            // Remove from loading set (no longer loading)
            const newLoadingIds = new Set(loadingHistoryIds.value)
            newLoadingIds.delete(this.#historyId!)
            loadingHistoryIds.value = newLoadingIds

            // Only update thumbnail if we have a valid thumbnail blob (not undefined)
            // This ensures we don't store placeholder or loading thumbnails
            if (thumbnail instanceof Blob && thumbnail.size > 0) {
                console.log('updating history item thumbnail', thumbnail)
                await updateHistoryItemThumbnail(this.#historyId!, thumbnail)
            } else {
                // If no valid thumbnail, keep thumbnail as undefined
                console.log('No valid thumbnail captured, keeping thumbnail as undefined')
                await updateHistoryItemThumbnail(this.#historyId!, undefined)
            }
        }, 1000)
    }

    async #getCanvasThumbnail(
        canvas: HTMLCanvasElement,
        thumbWidth = 200,
        thumbHeight = 200
    ): Promise<Blob> {
        // Create a new canvas for the thumbnail
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = thumbWidth
        thumbCanvas.height = thumbHeight
        const ctx = thumbCanvas.getContext('2d')!

        // Draw the original canvas content scaled down
        ctx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight)

        // Convert to JPEG blob
        return new Promise<Blob>((resolve) => {
            thumbCanvas.toBlob((blob) => {
                resolve(blob!)
            }, 'image/jpeg', 0.8)
        })
    }
}
