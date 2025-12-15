import { variables, spatialArea, dateTimeRange, plotType, canGeneratePlots } from '../state'
import { Options } from '../types'


export function storeOptionsInLocalStorage() {
    const options: Options = {
        plotType: plotType.value,
        variables: variables.value.map(v => v.variable.dataFieldId),
        spatialArea: spatialArea.value,
        dateTimeRange: dateTimeRange.value,
        canGeneratePlots: canGeneratePlots.value,
    }

    localStorage.setItem('terra-options', JSON.stringify(options))
}
    
export function getOptionsFromLocalStorage() {
    const options = localStorage.getItem('terra-options')
    return options ? JSON.parse(options) as Options : null
}

export function clearOptionsFromLocalStorage() {
    localStorage.removeItem('terra-options')
}
