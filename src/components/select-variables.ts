import { assert } from '../utilities/error'
import { effect } from '@preact/signals-core'
import { variables } from '../state'
import type { TerraBrowseVariables, TerraVariablesChangeEvent } from '@nasa-terra/components'

export class SelectVariables {
    private element: TerraBrowseVariables

    constructor(selector: string) {
        const el = document.querySelector<TerraBrowseVariables>(selector)

        assert(el, `Element matching selector was not found: ${selector}`)

        this.element = el

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.element.addEventListener('terra-variables-change', this.#handleChange.bind(this))
    }

    #setupEffects() {
        effect(() => {
            console.log('called for V ', variables.value)
        })
    }

    #handleChange(e: TerraVariablesChangeEvent) {
        variables.value = e.detail.selectedVariables
    }
}
