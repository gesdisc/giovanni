import { AddVariableDialogComponent } from './components/add-variable-dialog'
import { PlotsListComponent } from './components/plots-list'
import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { setBasePath } from '@nasa-terra/components'
import { SidebarToggleComponent } from './components/sidebar-toggle'

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.29/cdn/')

document.addEventListener('DOMContentLoaded', () => {
    new SidebarToggleComponent()
    new AddVariableDialogComponent()
    new SelectVariablesComponent()
    new SelectSpatialAreaComponent()
    new SelectDateTimeRangeComponent()
    new PlotsListComponent()
})
