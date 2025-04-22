import { Variable } from '../types'

export class VariableComponent {
    variable: Variable
    element: HTMLElement

    constructor(variable: Variable) {
        this.variable = variable
        this.element = document.createElement('div')
    
        this.element.innerHTML = `
            <div>${this.variable.dataFieldLongName}</div>
        `
    }

    destroy() {
        this.element.parentElement?.removeChild(this.element)
    }
}
