import { effect } from '@preact/signals-core'
import { VariableComponent } from './variable'
import { variables } from '../state'
import type {
    TerraBrowseVariables,
    TerraVariablesChangeEvent,
} from '@nasa-terra/components'

export class SelectVariablesComponent {
    #element: TerraBrowseVariables
    #selectedVariablesList: HTMLElement

    constructor(selector: string, selectedVariablesListSelector: string) {
        this.#element = document.querySelector<TerraBrowseVariables>(selector)!
        this.#selectedVariablesList = document.querySelector<HTMLElement>(
            selectedVariablesListSelector
        )!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#element.addEventListener(
            'terra-variables-change',
            this.#handleChange.bind(this)
        )
    }

    #setupEffects() {
        effect(() => {
            console.log('selected variables changed: ', variables.value)
                    
            variables.value.forEach(v => this.#selectedVariablesList.appendChild(v.element))
        })
    }

    #handleChange(e: TerraVariablesChangeEvent) {
        // destroy any existing variables
        // we'll render the variable list from scratch anytime the user makes a selection
        variables.value.forEach(v => v.destroy()) 

        variables.value = e.detail.selectedVariables.map(v => new VariableComponent(v))
    }
}
