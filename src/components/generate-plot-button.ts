import { canGeneratePlots, userState } from '../state'
import { effect } from '@preact/signals-core'
import { getOptionsFromCurrentUrl } from '../utilities/url'

export class GeneratePlotButtonComponent {
    #button: HTMLButtonElement
    #generatePlotWhenReady: boolean = false

    constructor() {
        this.#button = document.querySelector<HTMLButtonElement>('#generate-plot-button')!
        this.#setupEffects()
        this.#bindEvents()

        const options = getOptionsFromCurrentUrl()

        if (options.canGeneratePlots) {
            this.#generatePlotWhenReady = true
        }
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

            // if we should generate a plot on load, go and and click the button on behalf of the user so the plot
            // automatically loads
            if (this.#generatePlotWhenReady && canGeneratePlots.value) {
                this.#generatePlotWhenReady = false
                
                setTimeout(() => {
                    this.#handleButtonClick(true)
                }, 500)
            }
        })
    }

    #bindEvents() {
        this.#button.addEventListener('click', () => {
            this.#handleButtonClick()
        })
    }

    #handleButtonClick(force?: boolean) {
        if (!canGeneratePlots.value && !force) return

        if (force) {
            console.log('Came from a URL with sufficient options to generate the plot automatically')
        }

        if (userState.value.user?.uid) {
            document.dispatchEvent(new CustomEvent('generate-plot'))
        } else {
            document.dispatchEvent(new CustomEvent('open-login-modal'))
        }
    }
}
