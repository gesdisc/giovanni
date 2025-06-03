import { effect } from '@preact/signals-core'
import { variables } from '../state'

export class VariableCountComponent {
    #element: HTMLElement

    constructor() {
        this.#element =
            document.querySelector('#variable-count')!

        this.#setupEffects()
    }

    #setupEffects() {
        effect(() => {
            this.#element.innerHTML = variables.value.length > 0 ? `${variables.value.length} selected` : ''
        })
    }
}
