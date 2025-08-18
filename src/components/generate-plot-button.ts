import { canGeneratePlots, variables, spatialArea, dateTimeRange } from '../state'
import { effect } from '@preact/signals-core'

export class GeneratePlotButtonComponent {
    #button: HTMLButtonElement

    constructor() {
        this.#button = document.querySelector<HTMLButtonElement>('#generate-plot-button')!
        this.#setupEffects()
        this.#bindEvents()
    }

    #setupEffects() {
        effect(() => {
            // Enable/disable button based on whether we can generate plots
            this.#button.disabled = !canGeneratePlots.value
            
            if (canGeneratePlots.value) {
                this.#button.className = 'w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
            } else {
                this.#button.className = 'w-full bg-gray-300 text-gray-500 font-semibold py-3 px-4 rounded-lg cursor-not-allowed'
            }
        })
    }

    #bindEvents() {
        this.#button.addEventListener('click', () => {
            if (!canGeneratePlots.value) return
            
            // Trigger plot generation by dispatching a custom event
            document.dispatchEvent(new CustomEvent('generate-plot', {
                detail: {
                    variables: variables.value,
                    spatialArea: spatialArea.value,
                    dateTimeRange: dateTimeRange.value
                }
            }))
        })
    }
}
