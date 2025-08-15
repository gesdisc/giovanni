import { getAllData, IndexedDbStores } from '../utilities/indexeddb'
import type { TimeSeriesRequestHistoryItem } from '../types'
import {
    dateTimeRange,
    spatialArea,
    userHistory,
    userState,
    variables,
} from '../state'
import { effect } from '@preact/signals-core'
import { VariableComponent } from './variable'

export class HistoryPanelComponent {
    #containerEl: HTMLElement
    #thumbnailsContainerEl: HTMLElement | null = null
    #leftArrowEl: HTMLElement | null = null
    #rightArrowEl: HTMLElement | null = null
    #gridButtonEl: HTMLElement | null = null
    #history: TimeSeriesRequestHistoryItem[] = []
    #currentScrollPosition = 0
    #scrollStep = 200 // pixels to scroll per arrow click

    constructor() {
        this.#containerEl = document.getElementById('history-panel')!
        this.#thumbnailsContainerEl = this.#containerEl.querySelector(
            '#thumbnails-container'
        )
        this.#leftArrowEl = this.#containerEl.querySelector('#left-arrow')
        this.#rightArrowEl = this.#containerEl.querySelector('#right-arrow')
        this.#gridButtonEl = this.#containerEl.querySelector('#grid-button')

        this.#setupEffects()
        this.#loadHistory()
        this.#setupEventListeners()
    }

    #setupEffects() {
        effect(() => {
            if (userHistory.value.length > 0 && userState.value.user?.uid) {
                this.#containerEl.classList.add('visible')
                this.#renderThumbnails()
            } else {
                this.#containerEl.classList.remove('visible')
            }
        })
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

        // set user history in state
        userHistory.value = this.#history
    }

    #setupEventListeners() {
        this.#leftArrowEl!.addEventListener('click', () => this.#scrollLeft())
        this.#rightArrowEl!.addEventListener('click', () => this.#scrollRight())

        this.#gridButtonEl!.addEventListener('click', () => this.#showAllHistory())

        this.#thumbnailsContainerEl!.addEventListener('wheel', e => {
            e.preventDefault()
            if (e.deltaY > 0) {
                this.#scrollRight()
            } else {
                this.#scrollLeft()
            }
        })

        document.addEventListener('historyUpdated', () => {
            this.#loadHistory()
        })
    }

    #renderThumbnails() {
        if (!this.#thumbnailsContainerEl) return

        if (this.#history.length === 0) {
            this.#thumbnailsContainerEl.innerHTML = `
                <div class="flex items-center justify-center text-gray-400 text-sm py-4">
                    No history yet
                </div>
            `
            return
        }

        this.#thumbnailsContainerEl.innerHTML = this.#history
            .map(item => {
                const v = item.request.variable
                const area = item.request.spatialArea
                const range = item.request.dateTimeRange

                // Create area string for tooltip
                let areaStr = ''
                if (area.type === 'global') {
                    areaStr = 'Global'
                } else if (area.type === 'coordinates') {
                    areaStr =
                        area.value &&
                        typeof area.value.lat === 'string' &&
                        typeof area.value.lng === 'string'
                            ? `${area.value.lat}, ${area.value.lng}`
                            : 'Coordinates'
                } else if (area.type === 'bounding_box') {
                    areaStr = `${area.value.west}, ${area.value.south}, ${area.value.east}, ${area.value.north}`
                }

                const dateStr =
                    range.startDate && range.endDate
                        ? `${range.startDate} to ${range.endDate}`
                        : 'No date range'

                const createdAt = new Date(item.createdAt)
                const timeStr =
                    createdAt.toLocaleDateString() +
                    ' ' +
                    createdAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })

                return `
                    <div class="thumbnail-item flex-shrink-0 relative group" data-id="${item.id}" data-tooltip-content="${v.dataFieldLongName || v.dataFieldId}|${timeStr}|${dateStr}|${areaStr}">
                        <!-- Thumbnail -->
                        <div class="w-24 h-16 bg-gray-100 border border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                            ${
                                item.request.thumbnail
                                    ? `<img src="${URL.createObjectURL(item.request.thumbnail)}" alt="Plot thumbnail" class="w-full h-full rounded" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
                                    : ''
                            }
                            <!-- Placeholder for plot thumbnail - shown when no thumbnail URL or image fails to load -->
                            <div class="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center" ${item.request.thumbnail ? 'style="display: none;"' : ''}>
                                <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                `
            })
            .join('')

        // Add click listeners to thumbnails
        this.#thumbnailsContainerEl
            .querySelectorAll('.thumbnail-item')
            .forEach(thumbnail => {
                thumbnail.addEventListener('click', e => {
                    const id = (e.currentTarget as HTMLElement).getAttribute(
                        'data-id'
                    )!
                    const item = this.#history.find(h => h.id === id)
                    if (item) {
                        this.#loadHistoryItem(item)
                    }
                })
            })

        // Add tooltip functionality
        this.#setupTooltips()
    }

    #setupTooltips() {
        // Add mouse event listeners to thumbnails
        this.#thumbnailsContainerEl
            ?.querySelectorAll('.thumbnail-item')
            .forEach(thumbnail => {
                thumbnail.addEventListener('mouseenter', e => {
                    const target = e.currentTarget as HTMLElement
                    const tooltipContent = target.getAttribute('data-tooltip-content')
                    if (tooltipContent) {
                        const [title, time, date, area] = tooltipContent.split('|')
                        const tooltip = document.getElementById('thumbnail-tooltip')
                        if (tooltip) {
                            tooltip.innerHTML = `
                        <div class="font-semibold mb-1">${title}</div>
                        <div class="text-gray-300">${time}</div>
                        <div class="text-gray-300">${date}</div>
                        <div class="text-gray-300">${area}</div>
                        <!-- Arrow pointing down -->
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    `

                            // Position tooltip
                            const rect = target.getBoundingClientRect()
                            const tooltipRect = tooltip.getBoundingClientRect()

                            // Position above the thumbnail
                            let left =
                                rect.left + rect.width / 2 - tooltipRect.width / 2
                            let top = rect.top - tooltipRect.height - 8 // 8px gap

                            // Ensure tooltip doesn't go off screen
                            if (left < 10) left = 10
                            if (left + tooltipRect.width > window.innerWidth - 10) {
                                left = window.innerWidth - tooltipRect.width - 10
                            }
                            if (top < 10) {
                                // If tooltip would go above viewport, show it below instead
                                top = rect.bottom + 8
                            }

                            tooltip.style.left = `${left}px`
                            tooltip.style.top = `${top}px`
                            tooltip.style.opacity = '1'
                        }
                    }
                })

                thumbnail.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('thumbnail-tooltip')
                    if (tooltip) {
                        tooltip.style.opacity = '0'
                    }
                })
            })
    }

    #scrollLeft() {
        if (!this.#thumbnailsContainerEl) return

        this.#currentScrollPosition = Math.max(
            0,
            this.#currentScrollPosition - this.#scrollStep
        )
        this.#thumbnailsContainerEl.style.transform = `translateX(-${this.#currentScrollPosition}px)`

        this.#updateArrowStates()
    }

    #scrollRight() {
        if (!this.#thumbnailsContainerEl) return

        const containerWidth =
            this.#thumbnailsContainerEl.parentElement?.clientWidth || 0
        const scrollWidth = this.#thumbnailsContainerEl.scrollWidth
        const maxScroll = Math.max(0, scrollWidth - containerWidth + 100) // +100 for padding

        this.#currentScrollPosition = Math.min(
            maxScroll,
            this.#currentScrollPosition + this.#scrollStep
        )
        this.#thumbnailsContainerEl.style.transform = `translateX(-${this.#currentScrollPosition}px)`

        this.#updateArrowStates()
    }

    #updateArrowStates() {
        if (!this.#leftArrowEl || !this.#rightArrowEl || !this.#thumbnailsContainerEl)
            return

        const containerWidth =
            this.#thumbnailsContainerEl.parentElement?.clientWidth || 0
        const scrollWidth = this.#thumbnailsContainerEl.scrollWidth
        const maxScroll = Math.max(0, scrollWidth - containerWidth + 100)

        // Update left arrow
        if (this.#currentScrollPosition <= 0) {
            this.#leftArrowEl.classList.add('opacity-50', 'cursor-not-allowed')
            this.#leftArrowEl.classList.remove(
                'hover:text-gray-800',
                'hover:bg-gray-100'
            )
        } else {
            this.#leftArrowEl.classList.remove('opacity-50', 'cursor-not-allowed')
            this.#leftArrowEl.classList.add(
                'hover:text-gray-800',
                'hover:bg-gray-100'
            )
        }

        // Update right arrow
        if (this.#currentScrollPosition >= maxScroll) {
            this.#rightArrowEl.classList.add('opacity-50', 'cursor-not-allowed')
            this.#rightArrowEl.classList.remove(
                'hover:text-gray-800',
                'hover:bg-gray-100'
            )
        } else {
            this.#rightArrowEl.classList.remove('opacity-50', 'cursor-not-allowed')
            this.#rightArrowEl.classList.add(
                'hover:text-gray-800',
                'hover:bg-gray-100'
            )
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
                item.request.variable.dataFieldLongName,
                true
            ),
        ]
    }

    #showAllHistory() {
        // Create a temporary history panel instance to show the full view
        const tempPanel = document.createElement('div')
        tempPanel.id = 'temp-history-panel'
        tempPanel.className =
            'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'
        tempPanel.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div class="flex items-center justify-between p-4 border-b">
                    <h2 class="text-lg font-semibold">History</h2>
                    <button id="close-history" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div id="history-content-full" class="overflow-y-auto max-h-[calc(80vh-80px)]">
                    <!-- History content will be rendered here -->
                </div>
            </div>
        `

        document.body.appendChild(tempPanel)

        // Render the full history content
        const contentEl = tempPanel.querySelector('#history-content-full')
        if (contentEl) {
            this.#renderFullHistoryContent(contentEl)
        }

        // Add close functionality
        tempPanel.querySelector('#close-history')?.addEventListener('click', () => {
            document.body.removeChild(tempPanel)
        })

        // Close on backdrop click
        tempPanel.addEventListener('click', e => {
            if (e.target === tempPanel) {
                document.body.removeChild(tempPanel)
            }
        })
    }

    #renderFullHistoryContent(contentEl: Element) {
        if (this.#history.length === 0) {
            contentEl.innerHTML =
                '<div class="p-6 text-center text-gray-500">No history yet</div>'
            return
        }

        contentEl.innerHTML = this.#history
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
                        typeof area.value.lat === 'string' &&
                        typeof area.value.lng === 'string'
                            ? `Lat: ${area.value.lat}, Lng: ${area.value.lng}`
                            : 'Coordinates: (invalid or missing)'
                } else if (area.type === 'bounding_box') {
                    areaStr = 'Bounding Box'
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

        // Add click listeners
        contentEl.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!
                const item = this.#history.find(h => h.id === id)
                if (item) {
                    this.#loadHistoryItem(item)
                    // Close the modal after loading
                    const modal = document.getElementById('temp-history-panel')
                    if (modal) {
                        document.body.removeChild(modal)
                    }
                }
            })
        })
    }
}
