import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { SidebarToggleComponent } from './components/sidebar-toggle'

document.addEventListener('DOMContentLoaded', () => {
    new SidebarToggleComponent('#sidebar-toggle', '#sidebar')
    new SelectVariablesComponent('#variable-selector', '#selected-variables')
    new SelectSpatialAreaComponent('#spatial-picker')
    new SelectDateTimeRangeComponent('#start-date', '#end-date')
})
