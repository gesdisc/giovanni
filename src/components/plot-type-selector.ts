export type PlotType = 'map' | 'plot'

export class PlotTypeSelectorComponent {
    #mapButton: HTMLButtonElement
    #plotButton: HTMLButtonElement
    #currentPlotType: PlotType = 'plot' // Default to plot

    constructor() {
        this.#mapButton = document.querySelector<HTMLButtonElement>('#map-button')!
        this.#plotButton = document.querySelector<HTMLButtonElement>('#plot-button')!

        this.#bindEvents()
        this.#updateButtonStates()
    }

    #bindEvents() {
        this.#mapButton.addEventListener('click', () => {
            this.setPlotType('map')
        })

        this.#plotButton.addEventListener('click', () => {
            this.setPlotType('plot')
        })
    }

    #updateButtonStates() {
        // Update map button
        if (this.#currentPlotType === 'map') {
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

        // Update plot button
        if (this.#currentPlotType === 'plot') {
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
    }

    setPlotType(plotType: PlotType) {
        this.#currentPlotType = plotType
        this.#updateButtonStates()
        
        // Dispatch custom event for other components to listen to
        document.dispatchEvent(new CustomEvent('plot-type-changed', {
            detail: { plotType }
        }))
    }

    getPlotType(): PlotType {
        return this.#currentPlotType
    }
}
