import { AddVariableDialogComponent } from './components/add-variable-dialog'
import { PlotsListComponent } from './components/plots-list'
import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { PlotTypeSelectorComponent } from './components/plot-type-selector'
import { GeneratePlotButtonComponent } from './components/generate-plot-button'
import { setBasePath } from '@nasa-terra/components'
import '@nasa-terra/components/dist/components/site-header/site-header.js'
import '@nasa-terra/components/dist/components/harmony-history/harmony-history.js'
import { VariableCountComponent } from './components/variable-count'
import { LoginComponent } from './components/login'
import { LoginModalComponent } from './components/login-modal'
import { WelcomeSplashComponent } from './components/welcome-splash'
import { UrlsParamsComponent } from './components/url-params'
import type { SubsetJobStatus } from '@nasa-terra/components/dist/data-services/types.js'
import { effect } from '@preact/signals-core'
import { userState } from './state'

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.137/cdn/')

localStorage.setItem('terra-environment', 'prod')

document.addEventListener('DOMContentLoaded', () => {
    new UrlsParamsComponent()
    new WelcomeSplashComponent()
    new LoginComponent()
    new LoginModalComponent()
    new AddVariableDialogComponent()
    new PlotTypeSelectorComponent()
    new SelectVariablesComponent()
    new SelectSpatialAreaComponent()
    new SelectDateTimeRangeComponent()
    new PlotsListComponent()
    new GeneratePlotButtonComponent()
    new VariableCountComponent()

    initializeSidebarResize()
    initializeHarmonyHistory()
})

function initializeSidebarResize() {
    const sidebar = document.getElementById('sidebar') as HTMLElement
    const resizeHandle = document.getElementById('resize-handle') as HTMLElement
    const harmonyHistory = document.getElementById('harmony-history') as HTMLElement

    if (!sidebar || !resizeHandle || !harmonyHistory) return

    let isResizing = false
    let startX = 0
    let startWidth = 0

    const startResize = (e: MouseEvent | TouchEvent) => {
        isResizing = true
        startX = 'touches' in e ? e.touches[0].clientX : e.clientX
        startWidth = sidebar.offsetWidth

        document.addEventListener('mousemove', resize)
        document.addEventListener('touchmove', resize, { passive: false })
        document.addEventListener('mouseup', stopResize)
        document.addEventListener('touchend', stopResize)

        document.body.classList.add('resizing')
        sidebar.classList.add('resizing')
    }

    const resize = (e: MouseEvent | TouchEvent) => {
        if (!isResizing) return

        e.preventDefault()
        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const diff = currentX - startX
        const newWidth = Math.max(300, Math.min(2000, startWidth + diff))

        sidebar.style.width = `${newWidth}px`
        harmonyHistory.style.left = `${newWidth}px`
    }

    const stopResize = () => {
        isResizing = false
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('touchmove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.removeEventListener('touchend', stopResize)

        document.body.classList.remove('resizing')
        sidebar.classList.remove('resizing')
    }

    resizeHandle.addEventListener('mousedown', startResize)
    resizeHandle.addEventListener('touchstart', startResize, { passive: false })
}

function initializeHarmonyHistory() {
    const harmonyHistory = document.getElementById('harmony-history')
    if (!harmonyHistory) return

    effect(() => {
        harmonyHistory.hidden = !userState.value.user
    })

    harmonyHistory.addEventListener('terra-harmony-job-select', (e: Event) => {
        const job = (e as CustomEvent<{ job: SubsetJobStatus }>).detail.job
        loadPlotFromHarmonyJob(job)
    })
}

function loadPlotFromHarmonyJob(job: SubsetJobStatus) {
    const url = new URL(job.request)
    const searchParams = url.searchParams
    const labels = searchParams.getAll('label')
    const isMapPlot = labels.includes('terra-time-average-map')

    // Parse time range from subset=time("start":"end")
    let startDate: string | undefined
    let endDate: string | undefined
    for (const subset of searchParams.getAll('subset')) {
        const timeMatch = subset.match(/^time\("(.+?)":"(.+?)"\)$/)
        if (timeMatch) {
            startDate = timeMatch[1]
            endDate = timeMatch[2]
        }
    }

    // Parse spatial bounds from subset=lat(south:north) and subset=lon(west:east)
    let south: number | undefined, north: number | undefined, west: number | undefined, east: number | undefined
    for (const subset of searchParams.getAll('subset')) {
        const latMatch = subset.match(/^lat\((-?[\d.]+):(-?[\d.]+)\)$/)
        const lonMatch = subset.match(/^lon\((-?[\d.]+):(-?[\d.]+)\)$/)
        if (latMatch) { south = parseFloat(latMatch[1]); north = parseFloat(latMatch[2]) }
        if (lonMatch) { west = parseFloat(lonMatch[1]); east = parseFloat(lonMatch[2]) }
    }
    const point = searchParams.get('point')
    const location = west !== undefined && south !== undefined
        ? `${west},${south},${east},${north}`
        : point ?? undefined

    // Extract variable entry ID (e.g. GPM_3IMERGHH_06_precipitationCal) from query param
    const variableEntryId = searchParams.get('variable') ?? undefined

    if (!variableEntryId || !startDate || !endDate || !location) {
        console.warn('Cannot load plot from harmony job: missing required parameters', {
            variableEntryId,
            startDate,
            endDate,
            location,
        })
        return
    }

    const plotsEl = document.getElementById('plots')
    if (!plotsEl) return

    plotsEl.innerHTML = ''

    const plotContainer = document.createElement('div')
    plotContainer.className = 'mb-6'

    const plotEl = document.createElement(
        isMapPlot ? 'terra-time-average-map' : 'terra-time-series'
    ) as any

    plotEl.applicationId = 'giovanni-ui'
    plotEl.startDate = startDate
    plotEl.endDate = endDate
    plotEl.location = location

    if (isMapPlot) {
        // terra-time-average-map takes collection + variable separately
        const lastUnderscore = variableEntryId.lastIndexOf('_')
        plotEl.collection = variableEntryId.substring(0, lastUnderscore)
        plotEl.variable = variableEntryId.substring(lastUnderscore + 1)
    } else {
        plotEl.variableEntryId = variableEntryId
        plotEl.setAttribute('disable-auto-fetch', 'true')
    }

    plotContainer.appendChild(plotEl)
    plotsEl.appendChild(plotContainer)
}
