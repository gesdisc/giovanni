import {
    AppActions,
    AppContext,
    AppEvents,
    Variable
    } from '../types'
import { setup } from 'xstate'

const machine = setup({
    types: {
        context: {} as AppContext,
        events: {} as AppEvents,
    },
    actions: {
        updateVariables: ({ context, event }) => {
            if (event.type === AppActions.SELECT_VARIABLES) {
                context.variables = ([] as Variable[]).concat(context.variables, event.variables)
            }
        },
    },
}).createMachine({
    id: 'nasa-giovanni',
    initial: 'configuring',
    context: {
        variables: [] as Variable[],
        spatialArea: null,
        dateTimeRange: null,
    },
    states: {
        configuring: {
            description: 'User selecting one or more variables, date range, spatial area, and plot type',
            on: {
                [AppActions.SELECT_VARIABLES]: {
                    actions: 'updateVariables',
                },
            },
        },
    },
})

export {
    machine,
}