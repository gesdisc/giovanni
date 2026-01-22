import { TimeSeriesRequest, TimeSeriesRequestHistoryItem } from "./types"
import { IndexedDbStores, getDataByKey, storeDataByKey } from "./utilities/indexeddb"
import { userState } from "./state"

export async function storeTimeSeriesRequestInHistory(request: TimeSeriesRequest, plotType: 'map' | 'plot' = 'plot', id?: string) {
    const historyId = id || getUniqueIdForTimeSeriesRequest(request)
   
    console.log('storeTimeSeriesRequestInHistory', historyId, request)

    const userId = userState.value.user?.uid
    if (!userId) {
        // Do not store history if there is no logged-in user
        return
    }

    const key = `history:${userId}`

    // Load existing user history array (if any)
    const existing = await getDataByKey<{ items?: TimeSeriesRequestHistoryItem[] } | undefined>(
        IndexedDbStores.HISTORY,
        key
    )

    const newItem: TimeSeriesRequestHistoryItem = {
        id: historyId,
        request,
        createdAt: new Date().toISOString(),
        plotType,
    }

    const items = Array.isArray(existing?.items) ? [...existing!.items, newItem] : [newItem]

    // Persist back as one array for this user
    const result = await storeDataByKey(
        IndexedDbStores.HISTORY,
        key,
        { items }
    )

    // Dispatch event to notify components that history has been updated
    document.dispatchEvent(new CustomEvent('historyUpdated'))

    return result
}

export function getUniqueIdForTimeSeriesRequest(request: TimeSeriesRequest) {
    return encodeURIComponent(`${request.variable.dataFieldId}-${Date.now()}`)
}

export async function deleteTimeSeriesRequestFromHistory(id: string) {
    const userId = userState.value.user?.uid
    if (!userId) {
        return
    }

    const key = `history:${userId}`
    const existing = await getDataByKey<{ items?: TimeSeriesRequestHistoryItem[] } | undefined>(
        IndexedDbStores.HISTORY,
        key
    )

    const items = Array.isArray(existing?.items) ? existing!.items : []
    const nextItems = items.filter(item => item.id !== id)

    await storeDataByKey(IndexedDbStores.HISTORY, key, { items: nextItems })

    document.dispatchEvent(new CustomEvent('historyUpdated'))
}

export async function updateHistoryItemThumbnail(id: string, thumbnail: Blob | undefined) {
    const userId = userState.value.user?.uid
    if (!userId) {
        return
    }

    const key = `history:${userId}`
    const existing = await getDataByKey<{ items?: TimeSeriesRequestHistoryItem[] } | undefined>(
        IndexedDbStores.HISTORY,
        key
    )

    const items = Array.isArray(existing?.items) ? existing!.items : []
    const itemIndex = items.findIndex(item => item.id === id)
    
    if (itemIndex === -1) {
        console.warn(`History item with id ${id} not found`)
        return
    }

    // Update the thumbnail for the existing item
    items[itemIndex] = {
        ...items[itemIndex],
        request: {
            ...items[itemIndex].request,
            ...(thumbnail ? { thumbnail } : {}),
        },
    }

    await storeDataByKey(IndexedDbStores.HISTORY, key, { items })

    // Dispatch event to notify components that history has been updated
    document.dispatchEvent(new CustomEvent('historyUpdated'))
}
