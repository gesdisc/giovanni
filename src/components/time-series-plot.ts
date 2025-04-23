import { TerraPlot } from '@nasa-terra/components'
import { TimeSeriesData } from '@nasa-terra/components/dist/components/time-series/time-series.types.js'
import { TimeSeriesRequest } from '../services/types'
import { TimeSeriesServiceFactory } from '../factories/time-series-service'
import type { PlotData } from 'plotly.js-dist-min'

export class TimeSeriesPlotComponent {
    element: HTMLElement

    #plotEl: TerraPlot

    constructor(request: TimeSeriesRequest) {
        this.element = document.createElement('div')
        this.#plotEl = document.createElement('terra-plot')

        this.element.appendChild(this.#plotEl)

        TimeSeriesServiceFactory.getService().getData(request).then(timeSeries => {
            console.log('Returned time series data ', timeSeries)

            const plotlyData = this.#convertDataToPlotlyFormat(timeSeries)
            
            console.log('Plotting with data ', plotlyData)
            
            this.#plotEl.data = plotlyData
        })
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

    destroy() {
        this.element.parentElement?.removeChild(this.element)
    }
}
