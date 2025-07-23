import { getAllData, IndexedDbStores, getDb } from '../utilities/indexeddb'
import type { TimeSeriesRequestHistoryItem } from '../types'
import { variables, spatialArea, dateTimeRange } from '../state'
import { VariableComponent } from './variable'

export class HistoryPanelComponent {
    #panelEl: HTMLElement
    #headerEl: HTMLElement | undefined
    #contentEl: HTMLElement | undefined
    #expanded = false
    #history: TimeSeriesRequestHistoryItem[] = []

    constructor() {
        this.#panelEl = document.getElementById('history-panel')!

        this.#render()
        this.#loadHistory()
    }

    // Public method to refresh history data
    async refresh() {
        await this.#loadHistory()
    }

    async #loadHistory() {
        this.#history = await getAllData<TimeSeriesRequestHistoryItem>(
            IndexedDbStores.HISTORY
        )
        this.#history.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

        this.#render()
    }

    #render() {
        // Only hide panel if no history items and not currently expanded
        if (this.#history.length === 0 && !this.#expanded) {
            this.#panelEl.style.display = 'none'
            return
        }

        this.#panelEl.style.display = 'block'
        this.#panelEl.innerHTML = `
            <div class="bg-white shadow-lg rounded-t-lg border border-gray-200">
                <button id="history-header" class="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-t-lg focus:outline-none">
                    <span>History</span>
                    <svg class="w-4 h-4 transition-transform duration-200" style="transform: rotate(${this.#expanded ? 180 : 0}deg)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <div id="history-content" class="overflow-y-auto transition-all duration-300" style="max-height: ${this.#expanded ? '260px' : '0'};">
                    <!-- history items here -->
                </div>
            </div>
        `

        this.#headerEl = this.#panelEl.querySelector('#history-header') as
            | HTMLElement
            | undefined
        this.#contentEl = this.#panelEl.querySelector('#history-content') as
            | HTMLElement
            | undefined

        if (this.#headerEl) {
            this.#headerEl.addEventListener('click', () => this.#toggle())
        }
    }

    #renderItems() {
        if (!this.#expanded || !this.#contentEl) {
            if (this.#contentEl) this.#contentEl.innerHTML = ''
            return
        }

        if (this.#history.length === 0) {
            this.#contentEl.innerHTML =
                '<div class="p-6 text-center text-gray-500 text-sm">No history yet</div>'
            return
        }

        this.#contentEl.innerHTML = this.#history
            .map(item => {
                const v = item.request.variable
                const area = item.request.spatialArea
                const range = item.request.dateTimeRange
                let areaStr = ''

                if (area.type === 'global') {
                    areaStr = 'Global'
                } else if (area.type === 'coordinates') {
                    areaStr =
                        area.value &&
                        typeof area.value.lat === 'number' &&
                        typeof area.value.lng === 'number'
                            ? `Lat: ${area.value.lat.toFixed(4)}, Lng: ${area.value.lng.toFixed(4)}`
                            : 'Coordinates: (invalid or missing)'
                } else if (area.type === 'bounding_box') {
                    areaStr = Array.isArray(area.value)
                        ? `BBox: ${area.value.join(', ')}`
                        : 'BBox: (invalid or missing)'
                }

                const dateStr =
                    range.startDate && range.endDate
                        ? `${range.startDate} → ${range.endDate}`
                        : 'No date range'

                return `
                    <div class="border-b border-gray-100 last:border-b-0 group">
                        <div class="flex items-center">
                            <button class="flex-1 text-left p-4 hover:bg-gray-50 hover:shadow-sm hover:-translate-y-0.5 focus:outline-none focus:bg-gray-50 transition-all duration-200 cursor-pointer" data-id="${item.id}">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-mono text-sm font-medium text-blue-600 truncate" title="${v.dataFieldId}">
                                            ${v.dataFieldId}
                                        </div>
                                    </div>
                                
                                    <div class="flex-shrink-0 ml-2">
                                        <div class="text-xs text-gray-400">
                                            ${new Date(item.createdAt).toLocaleDateString()}
                                        </div>

                                        <div class="text-xs text-gray-400">
                                            ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="space-y-1">
                                    <div class="flex items-center text-xs text-gray-600">
                                        <svg class="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        <span class="truncate" title="${areaStr}">${areaStr}</span>
                                    </div>
                                    
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center text-xs text-gray-600">
                                            <svg class="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>

                                            <span class="truncate" title="${dateStr}">${dateStr}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                `
            })
            .join('')

        this.#contentEl.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!
                const item = this.#history.find(h => h.id === id)
                if (item) {
                    this.#loadHistoryItem(item)
                }
            })
        })

        this.#contentEl.querySelectorAll('button[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation()
                const id = (e.currentTarget as HTMLElement).getAttribute(
                    'data-delete-id'
                )!
                await this.#deleteHistoryItem(id)
            })
        })
    }

    async #deleteHistoryItem(id: string) {
        const db = await getDb()
        await db.delete(IndexedDbStores.HISTORY, id)
        await db.close()

        // Refresh the history data
        this.#history = await getAllData<TimeSeriesRequestHistoryItem>(
            IndexedDbStores.HISTORY
        )
        this.#history.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

        // Re-render items if panel is expanded
        if (this.#expanded && this.#contentEl) {
            this.#renderItems()
        }
    }

    #loadHistoryItem(item: TimeSeriesRequestHistoryItem) {
        // Reset current state
        variables.value = []
        spatialArea.value = null
        dateTimeRange.value = null

        // Load the history item's settings
        spatialArea.value = item.request.spatialArea
        dateTimeRange.value = item.request.dateTimeRange

        // Add the variable to trigger plot generation
        variables.value = [
            new VariableComponent(
                item.request.variable,
                item.request.variable.dataFieldLongName
            ),
        ]
    }

    #toggle() {
        this.#expanded = !this.#expanded
        this.#render()

        if (this.#expanded) {
            this.#renderItems()
        }
    }
}
