import { effect } from '@preact/signals-core'
import { spatialArea } from '../state'
import { SpatialAreaType } from '../types'
import type { TerraMapChangeEvent, TerraSpatialPicker } from '@nasa-terra/components'

export class SelectSpatialAreaComponent {
    #element: TerraSpatialPicker

    constructor() {
        this.#element = document.querySelector<TerraSpatialPicker>('#spatial-picker')!

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
        })
    }

    #handleChange(e: TerraMapChangeEvent) {
        if (e.detail.type === 'bbox') {
            spatialArea.value = {
                type: SpatialAreaType.BOUNDING_BOX,
                value: e.detail.bounds,
            }
        } else if (e.detail.type === 'point') {
            spatialArea.value = {
                type: SpatialAreaType.COORDINATES,
                value: e.detail.latLng,
            }
        }

        // we'll ignore any other types of map events for now
    }   
}
