import { effect, untracked } from '@preact/signals-core'
import { spatialArea } from '../state'
import { SpatialAreaType } from '../types'
import type { TerraMapChangeEvent, TerraSpatialPicker } from '@nasa-terra/components'

export class SelectSpatialAreaComponent {
    #element: TerraSpatialPicker

    constructor() {
        this.#element = document.querySelector<TerraSpatialPicker>('#spatial-picker')!

        this.updateSpatialAreaValue()

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#element.addEventListener(
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
