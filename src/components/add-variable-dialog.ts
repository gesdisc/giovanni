import { effect } from '@preact/signals-core'
import { TerraButton, TerraDialog } from '@nasa-terra/components'
import { variables } from '../state'

export class AddVariableDialogComponent {
    #buttonEl: TerraButton
    #dialogEl: TerraDialog

    constructor(buttonSelector: string, dialogSelector: string) {
        this.#buttonEl = document.querySelector<TerraButton>(buttonSelector)!
        this.#dialogEl = document.querySelector<TerraDialog>(dialogSelector)!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#buttonEl.addEventListener('touch', this.#openDialog.bind(this))
        this.#buttonEl.addEventListener('click', this.#openDialog.bind(this))
    }

    #setupEffects() {
        effect(() => {
            // close dialog any time a variable is selected
            if (variables.value.length) {
                this.#dialogEl.hide()
            }
        })
    }

    #openDialog() {
        this.#dialogEl.show()
    }
}
