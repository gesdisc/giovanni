import { assert } from '../utilities/error'
import { effect } from '@preact/signals-core'
import { TerraButton, TerraDialog } from '@nasa-terra/components'
import { variables } from '../state'

export class AddVariableDialogComponent {
    #buttonEl: TerraButton
    #dialogEl: TerraDialog

    constructor(buttonSelector: string, dialogSelector: string) {
        const buttonEl = document.querySelector<TerraButton>(buttonSelector)
        const dialogEl = document.querySelector<TerraDialog>(dialogSelector)

        assert(buttonEl, `Button selector was not found ${buttonSelector}`)
        assert(dialogEl, `Dialog selector was not found ${dialogSelector}`)

        this.#buttonEl = buttonEl
        this.#dialogEl = dialogEl

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
