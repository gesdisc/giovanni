import { SelectSpatialArea } from './components/select-spatial-area'
import { SelectVariables } from './components/select-variables'
import { SidebarToggle } from './components/sidebar-toggle'

document.addEventListener('DOMContentLoaded', () => {
    new SidebarToggle('#sidebar-toggle', '#sidebar')
    new SelectVariables('#variable-selector')
    new SelectSpatialArea('#spatial-picker')
})
