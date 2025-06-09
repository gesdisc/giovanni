import { TerraPlot } from '@nasa-terra/components'
import { TimeSeriesData } from '@nasa-terra/components/dist/components/time-series/time-series.types.js'
import { TimeSeriesRequest } from '../services/types'
import { TimeSeriesServiceFactory } from '../factories/time-series-service'
import type { PlotData } from 'plotly.js-dist-min'
import { DateTimeRange, SpatialArea } from '../types'

interface TimeSeriesPlotRequest extends TimeSeriesRequest {
    variableLongName: string
}

export class TimeSeriesPlotComponent {
    element: HTMLElement
    #plotEl: TerraPlot
    #loadingDialog: HTMLDialogElement
    #isLoading = false
    #currentRequest: TimeSeriesPlotRequest

    constructor(request: TimeSeriesPlotRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-plot')
        this.#loadingDialog = document.createElement('dialog')
        this.#currentRequest = request
        this.#setupLoadingDialog()

        // Add the dialog to the document body
        document.body.appendChild(this.#loadingDialog)
        
        this.element.appendChild(this.#plotEl)

        this.#plotEl.layout = {
            xaxis: {
                title: 'Time',
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: request.variableLongName,
                showline: false,
            },
            title: {
                text: request.variableLongName,
            },
        }

        this.#plotEl.config = {
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage', 'zoom2d', 'resetScale2d'],
            responsive: true,
        }

        this.#loadData(request)
    }

    #setupLoadingDialog() {
        this.#loadingDialog.className = 'p-6 rounded-lg shadow-lg bg-white border border-gray-200 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        
        const loader = document.createElement('terra-loader')
        loader.setAttribute('indeterminate', '')
        
        const message = document.createElement('p')
        message.className = 'mt-4 text-gray-700'
        message.textContent = 'Loading plot data...'
        
        const cancelButton = document.createElement('terra-button')
        cancelButton.textContent = 'Cancel'
        cancelButton.className = 'mt-4'
        cancelButton.addEventListener('click', () => {
            this.#isLoading = false
            this.#loadingDialog.close()
        })

        this.#loadingDialog.appendChild(loader)
        this.#loadingDialog.appendChild(message)
        this.#loadingDialog.appendChild(cancelButton)
    }

    async #loadData(request: TimeSeriesPlotRequest) {
        this.#isLoading = true
        this.#loadingDialog.showModal()

        try {
            const timeSeries = await TimeSeriesServiceFactory.getService().getData(request)
            console.log('Returned time series data ', timeSeries)

            const plotlyData = this.#convertDataToPlotlyFormat(timeSeries)
            
            console.log('Plotting with data ', plotlyData)
            
            // Clear existing data and update with new data
            this.#plotEl.data = []
            this.#plotEl.data = plotlyData
            
            // Force a redraw of the plot
            if (timeSeries.data.length > 0) {
                const currentLayout = this.#plotEl.layout as any
                this.#plotEl.layout = {
                    ...currentLayout,
                    xaxis: {
                        ...currentLayout.xaxis,
                        range: [
                            timeSeries.data[0].timestamp,
                            timeSeries.data[timeSeries.data.length - 1].timestamp
                        ]
                    }
                }
            }
        } catch (error) {
            console.error('Error loading plot data:', error)
            // TODO: Show error message to user
        } finally {
            if (this.#isLoading) {
                this.#isLoading = false
                this.#loadingDialog.close()
            }
        }
    }

    #convertDataToPlotlyFormat(timeSeries: TimeSeriesData): Partial<PlotData>[] {
        return [{
            // holds the default Plotly configuration options.
            // see https://plotly.com/javascript/time-series/
            type: 'scatter',
            mode: 'lines',
            line: { color: 'rgb(28, 103, 227)' },
            x: timeSeries.data.map(row => row.timestamp),
            y: timeSeries.data.map(row => row.value),
        }]
    }

    async updateDateTimeRange(newDateTimeRange: DateTimeRange) {
        if (this.#isLoading) return
        
        this.#currentRequest = {
            ...this.#currentRequest,
            dateTimeRange: newDateTimeRange
        }
        
        await this.#loadData(this.#currentRequest)
    }

    async updateSpatialArea(newSpatialArea: SpatialArea) {
        if (this.#isLoading) return
        
        this.#currentRequest = {
            ...this.#currentRequest,
            spatialArea: newSpatialArea
        }
        
        await this.#loadData(this.#currentRequest)
    }

    destroy() {
        this.#isLoading = false
        this.#loadingDialog.close()
        // Remove the dialog from the document
        this.#loadingDialog.parentElement?.removeChild(this.#loadingDialog)
        this.element.parentElement?.removeChild(this.element)
    }
}
