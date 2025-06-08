import { assert } from '../utilities/error'
import { SpatialAreaType } from '../types'
import { TimeSeriesData, TimeSeriesDataRow, TimeSeriesMetadata } from '@nasa-terra/components/dist/components/time-series/time-series.types.js'
import { TimeSeriesRequest, TimeSeriesService } from './types'
import { IndexedDbStores, getDataByKey, storeDataByKey } from '../utilities/indexeddb'

interface VariableDbEntry {
    variableEntryId: string
    key: string
    startDate: string
    endDate: string
    metadata: TimeSeriesMetadata
    data: TimeSeriesDataRow[]
}

export class CloudGiovanniTimeSeriesService implements TimeSeriesService {
    #baseUrl = 'https://8weebb031a.execute-api.us-east-1.amazonaws.com/SIT/'

    async getData({
        variable,
        spatialArea,
        dateTimeRange,
    }: TimeSeriesRequest): Promise<TimeSeriesData> {
        // TODO: add support for other types of spatial areas
        assert(spatialArea.type === SpatialAreaType.COORDINATES, `${spatialArea.type} is not supported yet`)
        assert(dateTimeRange.startDate && dateTimeRange.endDate, 'Start and end dates are required')

        // Create cache key from variable and location
        const variableEntryId = variable.dataFieldId.replace(/\./g, '_')
        const locationKey = `${spatialArea.value.lat},${spatialArea.value.lng}`
        const cacheKey = `${variableEntryId}_${locationKey}`

        // Check cache for existing data
        const existingData = await getDataByKey<VariableDbEntry>(
            IndexedDbStores.TIME_SERIES,
            cacheKey
        )

        if (
            existingData &&
            new Date(dateTimeRange.startDate) >= new Date(existingData.startDate) &&
            new Date(dateTimeRange.endDate) <= new Date(existingData.endDate)
        ) {
            // We have cached data that covers our requested range
            return this.#getDataInRange(existingData, dateTimeRange)
        }

        // Calculate data gaps we need to fetch
        const dataGaps = this.#calculateDataGaps(existingData, dateTimeRange)

        if (dataGaps.length === 0 && existingData) {
            // No gaps to fill, return existing data
            return this.#getDataInRange(existingData, dateTimeRange)
        }

        // Fetch new data for each gap
        let allData: TimeSeriesDataRow[] = existingData?.data || []
        let metadata = existingData?.metadata || {}

        for (const gap of dataGaps) {
            const url = `${this.#baseUrl}?${new URLSearchParams({
                data: variable.dataFieldId,
                lat: spatialArea.value.lat.toString(),
                lon: spatialArea.value.lng.toString(),
                time_start: `${gap.start}T00:00:00`,
                time_end: `${gap.end}T23:59:59`,
            }).toString()}`

            console.log('Fetching time series from Cloud Giovanni', url)

            const response = await fetch(url)
            const csv = await response.text()
            const newData = this.#parseTimeSeriesCsv(csv)

            allData = [...allData, ...newData.data]
            metadata = { ...metadata, ...newData.metadata }
        }

        // Sort and store the consolidated data
        if (allData.length > 0) {
            const sortedData = [...allData].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )

            await storeDataByKey<VariableDbEntry>(
                IndexedDbStores.TIME_SERIES,
                cacheKey,
                {
                    variableEntryId,
                    key: cacheKey,
                    startDate: sortedData[0].timestamp,
                    endDate: sortedData[sortedData.length - 1].timestamp,
                    metadata,
                    data: sortedData,
                }
            )
        }

        return this.#getDataInRange({ metadata, data: allData }, dateTimeRange)
    }

    #calculateDataGaps(
        existingData: VariableDbEntry | undefined,
        dateTimeRange: { startDate: string | null; endDate: string | null }
    ): Array<{ start: string; end: string }> {
        if (!existingData || !dateTimeRange.startDate || !dateTimeRange.endDate) {
            // No existing data or invalid date range, need to fetch the entire range
            return [{ start: dateTimeRange.startDate!, end: dateTimeRange.endDate! }]
        }

        const gaps: Array<{ start: string; end: string }> = []

        // Check if we need data before our cached range
        if (new Date(dateTimeRange.startDate) < new Date(existingData.startDate)) {
            gaps.push({ start: dateTimeRange.startDate, end: existingData.startDate })
        }

        // Check if we need data after our cached range
        if (new Date(dateTimeRange.endDate) > new Date(existingData.endDate)) {
            gaps.push({ start: existingData.endDate, end: dateTimeRange.endDate })
        }

        return gaps
    }

    #getDataInRange(
        data: TimeSeriesData | VariableDbEntry,
        dateTimeRange: { startDate: string | null; endDate: string | null }
    ): TimeSeriesData {
        if (!dateTimeRange.startDate || !dateTimeRange.endDate) {
            throw new Error('Start and end dates are required')
        }

        return {
            metadata: data.metadata,
            data: data.data
                .filter(row => {
                    const timestamp = new Date(row.timestamp)
                    return (
                        timestamp >= new Date(dateTimeRange.startDate!) &&
                        timestamp <= new Date(dateTimeRange.endDate!)
                    )
                })
                .sort(
                    (a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                ),
        }
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
