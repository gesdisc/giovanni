import { getDataByKey, IndexedDbStores } from '../utilities/indexeddb'
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

        // reload history when user changes
        effect(() => {
            const uid = userState.value.user?.uid
            if (uid) {
                this.#loadHistory()
            } else {
                // clear when no user
                this.#history = []
                userHistory.value = []
            }
        })
    }

    // Public method to refresh history data
    async refresh() {
        await this.#loadHistory()
    }

    async #loadHistory() {
        const uid = userState.value.user?.uid
        if (!uid) {
            this.#history = []
            userHistory.value = []
            return
        }

        const arrayKey = `history:${uid}`
        const arrayRecord = await getDataByKey<{ items?: TimeSeriesRequestHistoryItem[] }>(
            IndexedDbStores.HISTORY,
            arrayKey
        )

        if (arrayRecord && Array.isArray(arrayRecord.items)) {
            this.#history = arrayRecord.items
        }

        this.#history.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

        // set user history in state
        userHistory.value = this.#history
    }

    #setupEventListeners() {
        this.#leftArrowEl!.addEventListener('click', () => this.#scrollLeft())
        this.#rightArrowEl!.addEventListener('click', () => this.#scrollRight())

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
}
