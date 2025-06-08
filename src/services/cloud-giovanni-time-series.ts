import { assert } from '../utilities/error'
import { SpatialAreaType } from '../types'
import { TimeSeriesData, TimeSeriesDataRow, TimeSeriesMetadata } from '@nasa-terra/components/dist/components/time-series/time-series.types.js'
import { TimeSeriesRequest, TimeSeriesService } from './types'

export class CloudGiovanniTimeSeriesService implements TimeSeriesService {
    #baseUrl = 'https://8weebb031a.execute-api.us-east-1.amazonaws.com/SIT/'

    async getData({
        variable,
        spatialArea,
        dateTimeRange,
    }: TimeSeriesRequest): Promise<TimeSeriesData> {
        // TODO: add support for other types of spatial areas
        assert(spatialArea.type === SpatialAreaType.COORDINATES, `${spatialArea.type} is not supported yet`)

        const url = `${this.#baseUrl}?${new URLSearchParams({
            data: variable.dataFieldId,
            lat: spatialArea.value.lat.toString(),
            lon: spatialArea.value.lng.toString(),
            time_start: `${dateTimeRange.startDate}T00:00:00`,
            time_end: `${dateTimeRange.endDate}T23:59:59`,
        }).toString()}`

        console.log('Fetching time series from Cloud Giovanni', url)

        const response = await fetch(url) // TODO: login and include user token
        const csv = await response.text()

        return this.#parseTimeSeriesCsv(csv)
    }

    /**
     * the data we receive for the time series is in CSV format, but with metadata at the top
     * this function parses the CSV data and returns an object of the metadata and the data
     */
    #parseTimeSeriesCsv(text: string) {
        const lines = text
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)

        const metadata: Partial<TimeSeriesMetadata> = {}
        const data: TimeSeriesDataRow[] = []

        let inDataSection = false
        let dataHeaders: string[] = []

        for (const line of lines) {
            if (!inDataSection) {
                if (line === 'Timestamp (UTC),Data') {
                    // This marks the beginning of the data section
                    dataHeaders = line.split(',').map(h => h.trim())
                    inDataSection = true
                    continue
                }

                // Otherwise, treat as metadata (key,value)
                const [key, value] = line.split(',')
                if (key && value !== undefined) {
                    metadata[key.trim()] = value.trim()
                }
            } else {
                // Now parsing data rows
                const parts = line.split(',')
                if (parts.length === dataHeaders.length) {
                    const row: Record<string, string> = {}
                    for (let i = 0; i < dataHeaders.length; i++) {
                        row[dataHeaders[i]] = parts[i].trim()
                    }
                    data.push({
                        timestamp: row['Timestamp (UTC)'],
                        value: row['Data'],
                    })
                }
            }
        }

        return { metadata, data } as TimeSeriesData
    }
}
