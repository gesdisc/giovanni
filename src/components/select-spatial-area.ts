import { effect, untracked } from '@preact/signals-core'
import { spatialArea, plotType } from '../state'
import { SpatialAreaType } from '../types'
import type { TerraMapChangeEvent, TerraSpatialPicker } from '@nasa-terra/components'

export class SelectSpatialAreaComponent {
    #element: TerraSpatialPicker
    #heading: HTMLHeadingElement
    #previousPlotType: 'map' | 'plot' | null = null

    constructor() {
        this.#element = document.querySelector<TerraSpatialPicker>('#spatial-picker')!
        this.#heading = document.querySelector<HTMLHeadingElement>('#spatial-picker-heading')!

        this.#previousPlotType = plotType.value

        // Set initial heading text
        this.#updateHeading()

        // Rebuild the component on initial load if plot type is 'map' to ensure hidePointSelection is set before firstUpdated
        if (plotType.value === 'map') {
            this.#rebuildSpatialPicker()
        } else {
            this.updateSpatialAreaValue()
            this.#bindEvents()
        }

        this.#setupEffects()
    }

    #bindEvents() {
        this.#element.addEventListener(
            'terra-map-change',
            this.#handleChange.bind(this)
        )
    }

    #unbindEvents() {
        this.#element.removeEventListener(
            'terra-map-change',
            this.#handleChange.bind(this)
        )
    }

    #setupEffects() {
        effect(() => {
            console.log('spatial area changed: ', spatialArea.value)

            untracked(() => {
                this.updateSpatialAreaValue()
            })
        })

        effect(() => {
            // Update heading text based on plot type
            this.#updateHeading()

            // Rebuild the spatial picker when plot type changes to ensure hidePointSelection takes effect
            if (this.#previousPlotType !== null && this.#previousPlotType !== plotType.value) {
                this.#rebuildSpatialPicker()
            }
            this.#previousPlotType = plotType.value
        })
    }

    #updateHeading() {
        this.#heading.textContent = plotType.value === 'map' ? 'Region' : 'Location / Region'
    }

    #rebuildSpatialPicker() {
        // Store the current spatial area value before rebuilding
        const currentSpatialArea = spatialArea.value

        const parent = this.#element.parentElement
        if (!parent) return

        const label = this.#element.getAttribute('label') || ''
        const className = this.#element.className

        this.#unbindEvents()
        this.#element.remove()

        // Create a new element with the correct hidePointSelection property
        const newElement = document.createElement('terra-spatial-picker') as TerraSpatialPicker
        newElement.setAttribute('label', label)
        newElement.setAttribute('id', 'spatial-picker')
        newElement.className = className
        newElement.hidePointSelection = plotType.value === 'map'
        parent.appendChild(newElement)

        this.#element = newElement

        this.#bindEvents()

        if (currentSpatialArea) {
            untracked(() => {
                this.updateSpatialAreaValue()
            })
        }
    }

    updateSpatialAreaValue() {
        if (spatialArea.value && spatialArea.value.type === SpatialAreaType.BOUNDING_BOX) {
            const value = spatialArea.value.value.west + ',' + spatialArea.value.value.south + ',' + spatialArea.value.value.east + ',' + spatialArea.value.value.north

            if (this.#element.initialValue !== value) {
                this.#element.initialValue = value
                this.#element.setValue(value)
            }
        }

        if (spatialArea.value && spatialArea.value.type === SpatialAreaType.COORDINATES) {
            const value = spatialArea.value.value.lat + ',' + spatialArea.value.value.lng

            if (this.#element.initialValue !== value) {
                this.#element.initialValue = value
                this.#element.setValue(value)
            }
        }
    }

    #handleChange(e: TerraMapChangeEvent) {
        console.log('handleChange: ', e.detail)

        if (e.detail.type === 'bbox') {
            spatialArea.value = {
                type: SpatialAreaType.BOUNDING_BOX,
                value: {
                    west: e.detail.bounds.getWest().toFixed(4),
                    south: e.detail.bounds.getSouth().toFixed(4),
                    east: e.detail.bounds.getEast().toFixed(4),
                    north: e.detail.bounds.getNorth().toFixed(4),
                },
            }
        } else if (e.detail.type === 'point') {
            spatialArea.value = {
                type: SpatialAreaType.COORDINATES,
                value: {
                    lat: e.detail.latLng.lat.toFixed(4),
                    lng: e.detail.latLng.lng.toFixed(4),
                },
            }
        }

        // we'll ignore any other types of map events for now
    }   
}
