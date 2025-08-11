import { TimeSeriesRequest, TimeSeriesRequestHistoryItem } from "./types"
import { IndexedDbStores, storeDataByKey } from "./utilities/indexeddb"

export async function storeTimeSeriesRequestInHistory(request: TimeSeriesRequest) {
    const id = getUniqueIdForTimeSeriesRequest(request)
   
    console.log('storeTimeSeriesRequestInHistory', id, request)

    return storeDataByKey<TimeSeriesRequestHistoryItem>(
        IndexedDbStores.HISTORY,
        id,
        {
            id,
            request,
            createdAt: new Date().toISOString(),
        }
    )
}

export function getUniqueIdForTimeSeriesRequest(request: TimeSeriesRequest) {
    return encodeURIComponent(`${request.variable.dataFieldId}-${Date.now()}`)
}
