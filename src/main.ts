import { AppActions, SpatialAreaType } from './types'
import { assert } from './utilities/error'
import { createActor } from 'xstate'
import { machine } from './state/machine'
import type { TerraMapChangeEvent } from '@nasa-terra/components'

const actor = createActor(machine)

actor.subscribe(snapshot => {
    console.log('State is now:', snapshot.value, snapshot)
})

actor.start()

function toggleSidebar(event: Event) {
    const toggleEl = event.currentTarget as HTMLButtonElement
    const isExpanded = toggleEl.getAttribute('aria-expanded') == 'true'
    const sidebarEl = document.getElementById('sidebar')

    assert(sidebarEl, 'Sidebar element was not found')

    if (isExpanded) {
        toggleEl.setAttribute('aria-expanded', 'false')
        sidebarEl.classList.add('sidebar-closed')
    } else {
        toggleEl.setAttribute('aria-expanded', 'true')
        sidebarEl.classList.remove('sidebar-closed')
    }
}

function handleVariableSelectChange(e: Event) {
    const select = e.currentTarget as HTMLSelectElement
    actor.send({ type: AppActions.SELECT_VARIABLES, variables: [select.value] })
}

function handleSpatialPickerChange(e: TerraMapChangeEvent) {
    // TODO: support bounding box and global
    actor.send({ type: AppActions.SELECT_SPATIAL_AREA, spatialArea: {
        type: SpatialAreaType.COORDINATES,
        value: {
            lat: e.detail.latLng.lat,
            lng: e.detail.latLng.lng,
        }
    } })
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggleEl = document.getElementById('sidebar-toggle')
    const variableSelectorEl = document.getElementById('variable-selector')
    const spatialPickerEl = document.getElementById('spatial-picker')

    sidebarToggleEl?.addEventListener('click', toggleSidebar)
    sidebarToggleEl?.addEventListener('touchstart', toggleSidebar)
    variableSelectorEl?.addEventListener('change', handleVariableSelectChange)
    spatialPickerEl?.addEventListener('terra-map-change', handleSpatialPickerChange)
})
