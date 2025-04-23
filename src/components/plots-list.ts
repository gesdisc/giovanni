import {
    canGeneratePlots,
    dateTimeRange,
    spatialArea,
    variables
    } from '../state'
import { effect } from '@preact/signals-core'
import { TimeSeriesPlotComponent } from './time-series-plot'
import { Variable } from '../types'

export class PlotsListComponent {
    #listEl: HTMLElement

    constructor(listSelector: string) {
        this.#listEl = document.querySelector<HTMLElement>(listSelector)!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {}

    #setupEffects() {
        effect(() => {
            if (canGeneratePlots.value) {
                // TODO: how do we handle multiple variables? this just handles one
                this.#addTimeSeriesPlotForVariable(variables.value[0].variable)
            }
        })
    }

    async #addTimeSeriesPlotForVariable(variable: Variable) {
        console.log('add time series plot for variable ', variable)

        const plot = new TimeSeriesPlotComponent({
            variable,
            spatialArea: spatialArea.value!,
            dateTimeRange: dateTimeRange.value!,
        })

        this.#listEl.innerHTML = 'Loading plot...please wait'
        this.#listEl.appendChild(plot.element)
    }
}
