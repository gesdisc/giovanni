import { AppActions } from './types'
import { createActor } from 'xstate'
import { machine } from './state/machine'

const actor = createActor(machine)

actor.subscribe(snapshot => {
    console.log('State is now:', snapshot.value, snapshot)
})

actor.start()

function handleVariableSelect(e: Event) {
    const select = e.target as HTMLSelectElement
    actor.send({ type: AppActions.SELECT_VARIABLES, variables: [select.value] })
}

document.addEventListener('DOMContentLoaded', () => {
    document
        .getElementById('variable-selector')
        ?.addEventListener('change', handleVariableSelect)
})
