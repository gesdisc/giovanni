import { AddVariableDialogComponent } from './components/add-variable-dialog'
import { PlotsListComponent } from './components/plots-list'
import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { PlotTypeSelectorComponent } from './components/plot-type-selector'
import { GeneratePlotButtonComponent } from './components/generate-plot-button'
import { setBasePath } from '@nasa-terra/components'
import '@nasa-terra/components/dist/components/site-header/site-header.js'
import { VariableCountComponent } from './components/variable-count'
import { LoginComponent } from './components/login'
import { LoginModalComponent } from './components/login-modal'
import { HistoryPanelComponent } from './components/history-panel'
import { WelcomeSplashComponent } from './components/welcome-splash'

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.125/cdn/')

localStorage.setItem('terra-environment', 'uat')

document.addEventListener('DOMContentLoaded', () => {
    new WelcomeSplashComponent()
    new LoginComponent(),
    new LoginModalComponent()
    new AddVariableDialogComponent()
    new PlotTypeSelectorComponent()
    new SelectVariablesComponent()
    new SelectSpatialAreaComponent()
    new SelectDateTimeRangeComponent()
    new PlotsListComponent()
    new GeneratePlotButtonComponent()
    new VariableCountComponent()
    new HistoryPanelComponent()

    // Initialize sidebar resize functionality
    initializeSidebarResize()
})

function initializeSidebarResize() {
    const sidebar = document.getElementById('sidebar') as HTMLElement
    const resizeHandle = document.getElementById('resize-handle') as HTMLElement
    const historyPanel = document.getElementById('history-panel') as HTMLElement
    
    if (!sidebar || !resizeHandle || !historyPanel) return

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
        
        // Add CSS classes for visual feedback
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
        historyPanel.style.left = `${newWidth}px`
    }

    const stopResize = () => {
        isResizing = false
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('touchmove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.removeEventListener('touchend', stopResize)
        
        // Remove CSS classes
        document.body.classList.remove('resizing')
        sidebar.classList.remove('resizing')
    }

    // Add event listeners for both mouse and touch
    resizeHandle.addEventListener('mousedown', startResize)
    resizeHandle.addEventListener('touchstart', startResize, { passive: false })
}
