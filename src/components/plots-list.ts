import { canGeneratePlots, dateTimeRange, effectiveSpatialArea, plotType, variables } from '../state'
import { effect } from '@preact/signals-core'
import { TimeSeriesPlotComponent } from './time-series-plot'
import { MapPlotComponent } from './map-plot'
import { DateTimeRange, SpatialArea, Variable } from '../types'

type PlotInstance = {
    element: HTMLElement
    updateDateTimeRange: (range: DateTimeRange) => any
    updateSpatialArea: (area: SpatialArea) => any
    destroy: () => void
}

export class PlotsListComponent {
    #listEl: HTMLElement
    #activePlots: Map<string, PlotInstance> = new Map()
    #hasClearedDefaultView = false

    constructor() {
        this.#listEl = document.querySelector<HTMLElement>('#plots')!

        this.#setupEffects()
        this.#bindEvents()
    }

    #setupEffects() {
        // Effect for handling variables changes - just update the UI state
        effect(() => {
            if (!variables.value.length) {
                this.#listEl.innerHTML = this.getNoPlotsHtml()
                this.#hasClearedDefaultView = false
                return
            }

            // If we don't have all required settings, show the default view
            if (!canGeneratePlots.value) {
                this.#listEl.innerHTML = this.getNoPlotsHtml()
                this.#hasClearedDefaultView = false
                return
            }

            // Only clear the default view when we have valid settings but no plots yet
            if (!this.#hasClearedDefaultView) {
                this.#listEl.innerHTML = this.getReadyToGenerateHtml()
                this.#hasClearedDefaultView = true
            }
        })
    }

    #bindEvents() {
        document.addEventListener('generate-plot', (() => {
            this.#generatePlots()
        }) as EventListener)
    }

    async #generatePlots() {
        // Clear existing plots
        this.#listEl.innerHTML = ''
        this.#activePlots.clear()

        // Generate plots for all variables
        for (const v of variables.value) {
            if (plotType.value === 'map') {
                await this.#addMapPlotForVariable(
                    v.variable,
                    v.variableLongName
                )
            } else {
                await this.#addTimeSeriesPlotForVariable(
                    v.variable,
                    v.variableLongName
                )
            }
        }
    }

    async #addTimeSeriesPlotForVariable(
        variable: Variable,
        variableLongName: string
    ) {
        if (!canGeneratePlots.value) return

        console.log(
            'add time series plot for variable ',
            variable,
            effectiveSpatialArea.value,
            dateTimeRange.value
        )

        // Check if this variable component has the fromHistory flag
        const variableComponent = variables.value.find(v => v.variable.dataFieldId === variable.dataFieldId)
        
        const plot = new TimeSeriesPlotComponent({
            variable,
            spatialArea: effectiveSpatialArea.value as SpatialArea,
            dateTimeRange: dateTimeRange.value!,
            variableLongName,
            fromHistory: variableComponent?.fromHistory || false,
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

    async #addMapPlotForVariable(
        variable: Variable,
        variableLongName: string
    ) {
        if (!canGeneratePlots.value) return

        // Check if this variable component has the fromHistory flag
        const variableComponent = variables.value.find(v => v.variable.dataFieldId === variable.dataFieldId)

        const plot = new MapPlotComponent({
            variable,
            spatialArea: effectiveSpatialArea.value as SpatialArea,
            dateTimeRange: dateTimeRange.value!,
            variableLongName,
            fromHistory: variableComponent?.fromHistory || false,
        })

        const plotContainer = document.createElement('div')
        plotContainer.className = 'mb-6'
        plotContainer.setAttribute('data-variable-id', variable.dataFieldId)
        plotContainer.appendChild(plot.element)

        this.#listEl.appendChild(plotContainer)
        this.#activePlots.set(variable.dataFieldId, plot)
    }

    private getNoPlotsHtml() {
        return `
            <div
                class="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center"
            >
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
                        click "Generate Plot" to create your custom plot or
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

    private getReadyToGenerateHtml() {
        return `
            <div
                class="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center"
            >
                <div class="text-center max-w-md mx-auto">
                    <div
                        class="bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                    >
                        <svg
                            class="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <p class="text-gray-600 mb-4">
                        All settings are configured! Click "Generate Plot" 
                        in the sidebar to create your visualization.
                    </p>
                    <div class="text-sm text-gray-500">
                        <p class="mb-1">• Variables: ${variables.value.length} selected</p>
                        <p class="mb-1">
                            • Date range: ${dateTimeRange.value?.startDate} to ${dateTimeRange.value?.endDate}
                        </p>
                        <p class="mb-1">
                            • Spatial area: Configured
                        </p>
                    </div>
                </div>
            </div>
        `
    }
}
