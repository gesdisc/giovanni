import { DateTimeRange, SpatialArea, SpatialAreaType, TimeSeriesRequest } from '../types'
import { storeTimeSeriesRequestInHistory, updateHistoryItemThumbnail, updateHistoryItemPlotOptions, getUniqueIdForTimeSeriesRequest } from '../history'
import { loadingHistoryIds } from '../state'

interface MapPlotRequest extends TimeSeriesRequest {
    variableLongName: string
    fromHistory?: boolean
    historyId?: string | null
}

export class MapPlotComponent {
    element: HTMLElement
    #plotEl: any
    #request: MapPlotRequest
    #historyId: string | null = null
    #isRestoringOptions: boolean = false


    constructor(request: MapPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-time-average-map') as any

        this.element.appendChild(this.#plotEl)

        this.#request = request
        
        this.#historyId = request.historyId || null

        const { collectionId, variableShortName } = this.#getCollectionAndVariable(
            request.variable.dataFieldId,
            request.variable.dataFieldShortName
        )

        this.#plotEl.collection = collectionId
        this.#plotEl.variable = variableShortName
        this.updateDateTimeRange(request.dateTimeRange)
        this.updateSpatialArea(request.spatialArea)

        // Restore colormap and opacity if loading from history
        // Wait a bit for the component to be fully initialized before setting properties
        if (request.fromHistory) {
            this.#isRestoringOptions = true
            // Wait for the component to be connected and ready
            const restoreOptions = () => {
                if (request.colorMapName) {
                    // Try both property and attribute
                    if ('colorMapName' in this.#plotEl) {
                        this.#plotEl.colorMapName = request.colorMapName
                    } else if ('colormap' in this.#plotEl) {
                        this.#plotEl.colormap = request.colorMapName
                    } else {
                        this.#plotEl.setAttribute('color-map-name', request.colorMapName)
                    }
                    console.log('Restoring colorMapName:', request.colorMapName, 'on element:', this.#plotEl)
                }
                if (request.opacity !== undefined) {
                    if ('opacity' in this.#plotEl) {
                        this.#plotEl.opacity = request.opacity
                    } else {
                        this.#plotEl.setAttribute('opacity', String(request.opacity))
                    }
                    console.log('Restoring opacity:', request.opacity, 'on element:', this.#plotEl)
                }
                // Reset flag after a delay to allow the component to process the changes
                setTimeout(() => {
                    this.#isRestoringOptions = false
                }, 1000)
            }
            
            // Try immediately, then after a short delay, and also when component is ready
            restoreOptions()
            
            // Also try when the component fires a ready event if it exists
            this.#plotEl.addEventListener('connected', restoreOptions, { once: true })
        }

        if (!request.fromHistory) {
            // Call async function but don't block - errors will be logged
            this.#addToHistoryImmediately().catch(error => {
                console.error('Error adding map plot to history:', error)
            })
        }

        document.addEventListener(
            'terra-time-average-map-data-change',
            this.#handleDataChange.bind(this)
        )

        // Listen for plot options changes (colormap and opacity)
        this.#plotEl.addEventListener(
            'terra-plot-options-change',
            this.#handlePlotOptionsChange.bind(this)
        )
    }

    destroy() {
        document.removeEventListener(
            'terra-time-average-map-data-change',
            this.#handleDataChange.bind(this)
        )

        this.#plotEl.removeEventListener(
            'terra-plot-options-change',
            this.#handlePlotOptionsChange.bind(this)
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
        try {
            // Generate a unique ID for this history item
            this.#historyId = getUniqueIdForTimeSeriesRequest({
                variable: this.#request.variable,
                spatialArea: this.#request.spatialArea,
                dateTimeRange: this.#request.dateTimeRange,
            })

            console.log('Map plot adding to history with ID:', this.#historyId)

            // Track this item as loading
            loadingHistoryIds.value = new Set([...loadingHistoryIds.value, this.#historyId])

            // Add to history without thumbnail (will show placeholder)
            const result = await storeTimeSeriesRequestInHistory(
                {
                    variable: this.#request.variable,
                    spatialArea: this.#request.spatialArea,
                    dateTimeRange: this.#request.dateTimeRange,
                    thumbnail: undefined,
                },
                'map',
                this.#historyId
            )

            console.log('Map plot added to history:', result)
        } catch (error) {
            console.error('Error in #addToHistoryImmediately for map plot:', error)
            throw error
        }
    }

    async #handlePlotOptionsChange(e: CustomEvent) {
        if (e.target !== this.#plotEl) {
            return
        }

        // Skip if we're currently restoring options from history (to avoid circular updates)
        if (this.#isRestoringOptions) {
            return
        }

        // Skip updating history if we don't have a history ID
        if (!this.#historyId) {
            return
        }

        const colorMapName = e.detail?.colorMapName
        const opacity = e.detail?.opacity

        // Update history with new colormap and opacity
        if (colorMapName !== undefined || opacity !== undefined) {
            console.log('plot options change event updating history with new colormap and opacity', colorMapName, opacity)
            await updateHistoryItemPlotOptions(this.#historyId, colorMapName, opacity)
            
            // Also update the thumbnail since the visual appearance has changed
            // Wait a bit for the map to re-render with the new colormap/opacity
            this.#updateThumbnail()
        }
    }

    async #handleDataChange(e: CustomEvent) {
        console.log('data change event', e)

        if (e.target !== this.#plotEl) {
            console.log('data change event target is not this plot')
            return
        }

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
        await this.#updateThumbnail()
    }

    async #updateThumbnail() {
        if (!this.#historyId) {
            return
        }

        // Wait for the map to render and the GeoTIFF layer to load, then capture the canvas
        // We wait longer than for time-series plots because the GeoTIFF layer takes time to render
        setTimeout(async () => {
            let thumbnail: Blob | undefined

            try {
                // Find all canvas elements in the shadow DOM - the map may have multiple layers
                const shadowRoot = this.#plotEl.shadowRoot
                if (!shadowRoot) {
                    console.log('No shadow root found')
                    return
                }

                // Find the map container - it might be the terra-time-average-map element itself
                // or a container within the shadow root
                const mapContainer = shadowRoot.querySelector('.map-container') || 
                                   shadowRoot.querySelector('div[class*="map"]') ||
                                   this.#plotEl

                // Get all canvas elements
                const canvases = Array.from(shadowRoot.querySelectorAll('canvas')) as HTMLCanvasElement[]
                
                if (canvases.length === 0) {
                    console.log('No canvas elements found in shadow DOM')
                    return
                }

                console.log(`Found ${canvases.length} canvas element(s), compositing them...`)
                
                // Composite all canvases to capture all layers including GeoTIFF
                thumbnail = await this.#getCompositeCanvasThumbnail(canvases, mapContainer as HTMLElement)
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

    async #getCompositeCanvasThumbnail(
        canvases: HTMLCanvasElement[],
        container: HTMLElement,
        thumbWidth = 200,
        thumbHeight = 200
    ): Promise<Blob> {
        // Get the dimensions from the first canvas or container
        const firstCanvas = canvases[0]
        const sourceWidth = firstCanvas.width || container.clientWidth || 800
        const sourceHeight = firstCanvas.height || container.clientHeight || 600

        // Create a composite canvas that will hold all layers
        const compositeCanvas = document.createElement('canvas')
        compositeCanvas.width = sourceWidth
        compositeCanvas.height = sourceHeight
        const compositeCtx = compositeCanvas.getContext('2d')!

        // Draw all canvases in order (base map first, then overlays like GeoTIFF on top)
        // Each canvas is drawn at its actual size to preserve all layers
        for (const canvas of canvases) {
            if (canvas.width > 0 && canvas.height > 0) {
                // Draw the canvas at its actual dimensions to preserve all pixel data
                compositeCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, sourceWidth, sourceHeight)
            }
        }

        // Create thumbnail canvas and scale down
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = thumbWidth
        thumbCanvas.height = thumbHeight
        const thumbCtx = thumbCanvas.getContext('2d')!

        // Draw the composite canvas scaled down to thumbnail size
        thumbCtx.drawImage(compositeCanvas, 0, 0, thumbWidth, thumbHeight)

        // Convert to JPEG blob
        return new Promise<Blob>((resolve) => {
            thumbCanvas.toBlob((blob) => {
                resolve(blob!)
            }, 'image/jpeg', 0.8)
        })
    }
}
