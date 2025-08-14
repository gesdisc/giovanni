import { AddVariableDialogComponent } from './components/add-variable-dialog'
import { PlotsListComponent } from './components/plots-list'
import { SelectDateTimeRangeComponent } from './components/select-date-time-range'
import { SelectSpatialAreaComponent } from './components/select-spatial-area'
import { SelectVariablesComponent } from './components/select-variables'
import { setBasePath } from '@nasa-terra/components'
import { VariableCountComponent } from './components/variable-count'
import { LoginComponent } from './components/login'
import { LoginModalComponent } from './components/login-modal'
import { HistoryPanelComponent } from './components/history-panel'

setBasePath('https://cdn.jsdelivr.net/npm/@nasa-terra/components@0.0.29/cdn/')

// TODO: remove this in the future, right now we have to lock the environment to UAT while we wait for Cloud Giovanni to promote APIs to PROD
localStorage.setItem('terra-environment', 'uat')

document.addEventListener('DOMContentLoaded', () => {
    new LoginComponent(),
    new LoginModalComponent()
    new AddVariableDialogComponent()
    new SelectVariablesComponent()
    new SelectSpatialAreaComponent()
    new SelectDateTimeRangeComponent()
    new PlotsListComponent()
    new VariableCountComponent()
    new HistoryPanelComponent()
})
