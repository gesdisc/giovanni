import { CloudGiovanniTimeSeriesService } from '../services/cloud-giovanni-time-series'
import { TimeSeriesService } from '../services/types'

export class TimeSeriesServiceFactory {
    static getService(): TimeSeriesService {
        // TODO: logic here to determine which service to use for time series. For now we are just defaulting to Cloud Giovanni
        return new CloudGiovanniTimeSeriesService()
    }
}