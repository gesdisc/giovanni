import { TimeSeriesRequest, TimeSeriesRequestHistoryItem } from "./types"
import { IndexedDbStores, storeDataByKey } from "./utilities/indexeddb"

export async function storeTimeSeriesRequestInHistory(request: TimeSeriesRequest) {
    const id = getUniqueIdForTimeSeriesRequest(request)
   
    console.log('storeTimeSeriesRequestInHistory', id, request)

    const result = await storeDataByKey<TimeSeriesRequestHistoryItem>(
        IndexedDbStores.HISTORY,
        id,
        {
            id,
            request,
            createdAt: new Date().toISOString(),
        }
    )

    // Dispatch event to notify components that history has been updated
    document.dispatchEvent(new CustomEvent('historyUpdated'))

    return result
}

export function getUniqueIdForTimeSeriesRequest(request: TimeSeriesRequest) {
    return encodeURIComponent(`${request.variable.dataFieldId}-${Date.now()}`)
}
