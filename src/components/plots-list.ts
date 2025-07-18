import { canGeneratePlots, dateTimeRange, spatialArea, variables } from '../state'
import { effect } from '@preact/signals-core'
import { TimeSeriesPlotComponent } from './time-series-plot'
import { Variable } from '../types'

export class PlotsListComponent {
    #listEl: HTMLElement
    #activePlots: Map<string, TimeSeriesPlotComponent> = new Map()
    #hasClearedDefaultView = false

    constructor() {
        this.#listEl = document.querySelector<HTMLElement>('#plots')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {}

    #setupEffects() {
        // Effect for handling variables changes
        effect(() => {
            if (!variables.value.length) {
                this.#listEl.innerHTML = this.getNoPlotsHtml()
                this.#hasClearedDefaultView = false
                return
            }

            // Only clear the default view when we have valid plots to show
            if (!this.#hasClearedDefaultView && canGeneratePlots.value) {
                this.#listEl.innerHTML = ''
                this.#hasClearedDefaultView = true
            }

            // If we don't have all required settings, show the default view
            if (!canGeneratePlots.value) {
                this.#listEl.innerHTML = this.getNoPlotsHtml()
                this.#hasClearedDefaultView = false
                return
            }

            // Remove plots for variables that are no longer in the list
            for (const [variableId, plot] of this.#activePlots) {
                if (!variables.value.some(v => v.variable.dataFieldId === variableId)) {
                    plot.destroy()
                    this.#activePlots.delete(variableId)
                }
            }

            // Add plots for new variables
            for (const v of variables.value) {
                if (!this.#activePlots.has(v.variable.dataFieldId)) {
                    this.#addTimeSeriesPlotForVariable(
                        v.variable,
                        v.variableLongName
                    )
                }
            }

            // Reorder plots to match variable order
            const plotContainers = Array.from(this.#listEl.children)
            const orderedContainers = variables.value.map(v => {
                const container = plotContainers.find(container => 
                    container.getAttribute('data-variable-id') === v.variable.dataFieldId
                )
                if (!container) {
                    console.warn(`Could not find container for variable ${v.variable.dataFieldId}`)
                }
                return container
            }).filter((container): container is Element => container !== undefined)

            // Remove all containers and append them in the new order
            plotContainers.forEach(container => container.remove())
            orderedContainers.forEach(container => this.#listEl.appendChild(container))
        })

        // Effect for handling date range changes
        effect(() => {
            if (!canGeneratePlots.value || !dateTimeRange.value) return
            
            // Update all active plots with new date range
            for (const plot of this.#activePlots.values()) {
                plot.updateDateTimeRange(dateTimeRange.value)
            }
        })

        // Effect for handling spatial area changes
        effect(() => {
            if (!canGeneratePlots.value || !spatialArea.value) return
            
            // Update all active plots with new spatial area
            for (const plot of this.#activePlots.values()) {
                plot.updateSpatialArea(spatialArea.value)
            }
        })
    }

    async #addTimeSeriesPlotForVariable(
        variable: Variable,
        variableLongName: string
    ) {
        if (!canGeneratePlots.value) return

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
            variableLongName,
        })

        // Create a container for this plot
        const plotContainer = document.createElement('div')
        plotContainer.className = 'mb-6'
        plotContainer.setAttribute('data-variable-id', variable.dataFieldId)
        plotContainer.appendChild(plot.element)

        // Add the plot to the list
        this.#listEl.appendChild(plotContainer)
        
        // Store the plot in our active plots map
        this.#activePlots.set(variable.dataFieldId, plot)
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
