import { effect } from '@preact/signals-core'
import { VariableComponent } from './variable'
import { variables } from '../state'
import type {
    TerraBrowseVariables,
    TerraVariablesChangeEvent,
} from '@nasa-terra/components'
import Sortable from 'sortablejs'
import { getOptionsFromLocalStorage } from '../utilities/localstorage'
import { getOptionsFromCurrentUrl } from '../utilities/url'

export class SelectVariablesComponent {
    #element: TerraBrowseVariables
    #selectedVariablesList: HTMLElement
    #sortable: Sortable | null = null

    constructor() {
        this.#element =
            document.querySelector<TerraBrowseVariables>('#variable-selector')!
        this.#selectedVariablesList =
            document.querySelector<HTMLElement>('#selected-variables')!

        const options = getOptionsFromLocalStorage() || getOptionsFromCurrentUrl()

        if (options?.variables) {
            this.#element.selectedVariableEntryIds = options.variables.join(',')
        }

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

            this.#selectedVariablesList.innerHTML = variables.value.length === 0 ? `
                <div class="w-full mt-3 p-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors focus-ring">
                    <div class="flex items-center justify-center space-x-2">
                        <span class="text-sm">No variables selected yet</span>
                    </div>
                </div>
            ` : ''

            variables.value.forEach(v =>
                this.#selectedVariablesList.appendChild(v.element)
            )

            // Initialize or reinitialize Sortable
            if (variables.value.length > 0) {
                this.#initializeSortable()
            } else {
                this.#sortable?.destroy()
                this.#sortable = null
            }
        })
    }

    #initializeSortable() {
        if (this.#sortable) {
            this.#sortable.destroy()
        }

        this.#sortable = new Sortable(this.#selectedVariablesList, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                // Update the variables array to match the new order
                const newOrder = Array.from(this.#selectedVariablesList.children).map(
                    (el) => variables.value.find(v => v.element === el)
                ).filter((v): v is VariableComponent => v !== undefined)
                
                variables.value = newOrder
            }
        })
    }

    #handleChange(e: TerraVariablesChangeEvent) {
        console.log('handleChange', e)
        
        // Get existing variables that are still selected
        const existingVariables = variables.value.filter(v => 
            e.detail.selectedVariables.some(newV => newV.dataFieldId === v.variable.dataFieldId)
        )

        // Get new variables that weren't previously selected
        const newVariables = e.detail.selectedVariables
            .filter(v => !variables.value.some(existing => existing.variable.dataFieldId === v.dataFieldId))
            .map(v => new VariableComponent(v, v.dataFieldLongName))

        // Destroy variables that are no longer selected
        variables.value.forEach(v => {
            if (!e.detail.selectedVariables.some(newV => newV.dataFieldId === v.variable.dataFieldId)) {
                v.destroy()
            }
        })

        // Update variables array, preserving order of existing variables and appending new ones
        variables.value = [...existingVariables, ...newVariables]
    }
}
