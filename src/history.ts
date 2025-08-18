import { TimeSeriesRequest, TimeSeriesRequestHistoryItem } from "./types"
import { IndexedDbStores, storeDataByKey } from "./utilities/indexeddb"
import { userState } from "./state"

export async function storeTimeSeriesRequestInHistory(request: TimeSeriesRequest) {
    const id = getUniqueIdForTimeSeriesRequest(request)
   
    console.log('storeTimeSeriesRequestInHistory', id, request)

    const userId = userState.value.user?.uid
    if (!userId) {
        // Do not store history if there is no logged-in user
        return
    }

    const result = await storeDataByKey<TimeSeriesRequestHistoryItem>(
        IndexedDbStores.HISTORY,
        `${userId}:${id}`,
        {
            id,
            request,
            createdAt: new Date().toISOString(),
            userId,
        }
    )

    // Dispatch event to notify components that history has been updated
    document.dispatchEvent(new CustomEvent('historyUpdated'))

    return result
}

export function getUniqueIdForTimeSeriesRequest(request: TimeSeriesRequest) {
    return encodeURIComponent(`${request.variable.dataFieldId}-${Date.now()}`)
}
