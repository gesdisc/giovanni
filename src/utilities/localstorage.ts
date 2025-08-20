import { variables, spatialArea, dateTimeRange, plotType, canGeneratePlots } from '../state'
import { DateTimeRange, SpatialArea } from '../types'


export type Options = {
    plotType: 'map' | 'plot'
    variables: string[]
    spatialArea: SpatialArea | null
    dateTimeRange: DateTimeRange | null
    canGeneratePlots: boolean
}

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
