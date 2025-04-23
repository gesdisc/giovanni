import { setBasePath } from '@nasa-terra/components'
import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { SidebarToggleComponent } from './components/sidebar-toggle'

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.28/cdn/')

document.addEventListener('DOMContentLoaded', () => {
    new SidebarToggleComponent('#sidebar-toggle', '#sidebar')
    new SelectVariablesComponent('#variable-selector', '#selected-variables')
    new SelectSpatialAreaComponent('#spatial-picker')
    new SelectDateTimeRangeComponent('#start-date', '#end-date')
})
