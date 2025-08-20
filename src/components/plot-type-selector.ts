import { effect } from "@preact/signals-core"
import { plotType } from "../state"

export type PlotType = 'map' | 'plot'

export class PlotTypeSelectorComponent {
    #mapButton: HTMLButtonElement
    #plotButton: HTMLButtonElement

    constructor() {
        this.#mapButton = document.querySelector<HTMLButtonElement>('#map-button')!
        this.#plotButton = document.querySelector<HTMLButtonElement>('#plot-button')!

        this.#setupEffects()
        this.#bindEvents()
    }

    #setupEffects() {
        effect(() => {
        if (plotType.value === 'map') {
            this.#mapButton.className = 'plot-type-button plot-type-button--selected'
            const mapSvg = this.#mapButton.querySelector('svg')!
            const mapSpan = this.#mapButton.querySelector('span')!
            mapSvg.setAttribute('class', 'plot-type-icon plot-type-icon--selected')
            mapSpan.setAttribute('class', 'plot-type-label plot-type-label--selected')
        } else {
            this.#mapButton.className = 'plot-type-button plot-type-button--unselected'
            const mapSvg = this.#mapButton.querySelector('svg')!
            const mapSpan = this.#mapButton.querySelector('span')!
            mapSvg.setAttribute('class', 'plot-type-icon plot-type-icon--unselected')
            mapSpan.setAttribute('class', 'plot-type-label plot-type-label--unselected')
        }

        if (plotType.value === 'plot') {
            this.#plotButton.className = 'plot-type-button plot-type-button--selected'
            const plotSvg = this.#plotButton.querySelector('svg')!
            const plotSpan = this.#plotButton.querySelector('span')!
            plotSvg.setAttribute('class', 'plot-type-icon plot-type-icon--selected')
            plotSpan.setAttribute('class', 'plot-type-label plot-type-label--selected')
        } else {
            this.#plotButton.className = 'plot-type-button plot-type-button--unselected'
            const plotSvg = this.#plotButton.querySelector('svg')!
            const plotSpan = this.#plotButton.querySelector('span')!
            plotSvg.setAttribute('class', 'plot-type-icon plot-type-icon--unselected')
            plotSpan.setAttribute('class', 'plot-type-label plot-type-label--unselected')
        }
        })
    }

    #bindEvents() {
        this.#mapButton.addEventListener('click', () => {
            this.setPlotType('map')
        })

        this.#plotButton.addEventListener('click', () => {
            this.setPlotType('plot')
        })
    }

    setPlotType(newPlotType: PlotType) {
        plotType.value = newPlotType

        // Dispatch custom event for other components to listen to
        document.dispatchEvent(new CustomEvent('plot-type-changed', {
            detail: { plotType: newPlotType }
        }))
    }
}
