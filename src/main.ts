import { AddVariableDialogComponent } from './components/add-variable-dialog'
import { AlertsComponent } from './components/alerts'
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
import { effect } from '@preact/signals-core'
import { dateTimeRange, plotType, spatialArea, userState, variables } from './state'
import { SpatialAreaType, type Variable } from './types'
import { VariableComponent } from './components/variable'

type HarmonyJob = { jobID: string; request: string; labels?: string[] }

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.137/cdn/')

localStorage.setItem('terra-environment', 'prod')

document.addEventListener('DOMContentLoaded', () => {
    new UrlsParamsComponent()
    new LoginComponent()
    new LoginModalComponent()
    new AlertsComponent()
    new WelcomeSplashComponent()
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
        const job = (e as CustomEvent<{ job: HarmonyJob }>).detail.job
        loadPlotFromHarmonyJob(job)
    })
}

async function loadPlotFromHarmonyJob(job: HarmonyJob) {
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

    // --- Update sidebar state ---

    dateTimeRange.value = { startDate, endDate }

    // Spatial area
    if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
        if (west === south && east === north && west === east) {
            // point: lat and lon are equal
            spatialArea.value = { type: SpatialAreaType.COORDINATES, value: { lat: String(south), lng: String(west) } }
        } else if (west === -180 && south === -90 && east === 180 && north === 90) {
            spatialArea.value = { type: SpatialAreaType.GLOBAL }
        } else {
            spatialArea.value = {
                type: SpatialAreaType.BOUNDING_BOX,
                value: { west: String(west), south: String(south), east: String(east), north: String(north) },
            }
        }
    }

    // Plot type
    plotType.value = isMapPlot ? 'map' : 'plot'

    // Set a stub variable synchronously so the PlotsListComponent effect fires
    // and sets #hasClearedDefaultView=true before we insert the plot element.
    // Without this, the async selectVariableById resolves later, triggers the
    // effect, and wipes the rendered plot (requiring a second click to show it).
    const lastUnderscore = variableEntryId.lastIndexOf('_')
    const fieldShortName = variableEntryId.substring(lastUnderscore + 1)
    const collectionId = variableEntryId.substring(0, lastUnderscore)
    const stubVariable: Variable = {
        dataFieldId: variableEntryId,
        dataFieldShortName: fieldShortName,
        dataFieldAccessName: fieldShortName,
        dataFieldLongName: fieldShortName,
        dataProductShortName: collectionId,
        dataProductVersion: '',
        dataProductLongName: collectionId,
        dataProductTimeInterval: '',
        dataProductWest: -180,
        dataProductSouth: -90,
        dataProductEast: 180,
        dataProductNorth: 90,
        dataProductSpatialResolution: '',
        dataProductBeginDateTime: '',
        dataProductEndDateTime: '',
        dataFieldKeywords: [],
        dataFieldUnits: '',
        dataProductDescriptionUrl: '',
        dataFieldDescriptionUrl: '',
        dataProductInstrumentShortName: '',
    }
    variables.value = [new VariableComponent(stubVariable, fieldShortName)]

    // Asynchronously replace the stub with real variable metadata (for the
    // sidebar display). The effect won't wipe the plot because #hasClearedDefaultView
    // is already true by the time this resolves.
    selectVariableById(variableEntryId)

    const plotsEl = document.getElementById('plots')
    if (!plotsEl) return

    plotsEl.innerHTML = ''

    const plotContainer = document.createElement('div')
    plotContainer.className = 'mb-6'

    const plotEl = document.createElement(
        isMapPlot ? 'terra-time-average-map' : 'terra-time-series'
    ) as any

    plotEl.applicationId = 'giovanni-ui'
    plotEl.jobId = job.jobID
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

async function selectVariableById(variableEntryId: string) {
    const browseComponent = document.querySelector('terra-browse-variables') as any
    if (!browseComponent) return

    const variable = await browseComponent.getVariable(variableEntryId)
    if (!variable) {
        console.warn('Variable with entry ID not found in browse component: ', variableEntryId)
        // remove existing variable selection
        variables.value = []
        return
    }

    // select variable by setting state
    variables.value = [new VariableComponent(variable, variable.dataFieldLongName)]
}
