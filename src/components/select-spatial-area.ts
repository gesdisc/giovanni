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
        // TODO: support bounding box and global
        spatialArea.value = {
            type: SpatialAreaType.COORDINATES,
            value: e.detail.latLng,
        }
    }
}
