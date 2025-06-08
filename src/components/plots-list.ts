import { canGeneratePlots, dateTimeRange, spatialArea, variables } from '../state'
import { effect } from '@preact/signals-core'
import { TimeSeriesPlotComponent } from './time-series-plot'
import { Variable } from '../types'

export class PlotsListComponent {
    #listEl: HTMLElement

    constructor() {
        this.#listEl = document.querySelector<HTMLElement>('#plots')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {}

    #setupEffects() {
        effect(() => {
            this.#listEl.innerHTML = variables.value.length ? '' : this.getNoPlotsHtml()

            if (canGeneratePlots.value) {
                // TODO: how do we handle multiple variables? this just handles one
                this.#addTimeSeriesPlotForVariable(variables.value[0].variable)
            }
        })
    }

    async #addTimeSeriesPlotForVariable(variable: Variable) {
        console.log(
            'add time series plot for variable ',
            variable,
            spatialArea.value,
            dateTimeRange.value
        )

        const plot = new TimeSeriesPlotComponent({
            variable,
            spatialArea: spatialArea.value!,
            dateTimeRange: dateTimeRange.value!,
        })

        this.#listEl.innerHTML = 'Loading plot...please wait'
        this.#listEl.appendChild(plot.element)
    }

    private getNoPlotsHtml() {
        return `
            <div
                class="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center"
            >
                <!-- Placeholder for visualization -->
                <div class="text-center max-w-md mx-auto">
                    <div
                        class="nasa-bg-blue rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                    >
                        <svg
                            class="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>

                    <p class="text-gray-600 mb-4">
                        Configure your plot settings in the sidebar and
                        click "Plot Data" to create your custom plot or
                        map.
                    </p>
                    <div class="text-sm text-gray-500">
                        <p class="mb-1">• Add variables to analyze</p>
                        <p class="mb-1">
                            • Select plot type and date range
                        </p>
                        <p class="mb-1">
                            • Choose spatial area of interest
                        </p>
                    </div>
                </div>
            </div>
        `
    }
}
