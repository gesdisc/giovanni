import { dateTimeRange } from '../state'
import { effect } from '@preact/signals-core'
import { TerraDatePicker } from '@nasa-terra/components'

export class SelectDateTimeRangeComponent {
    #el: HTMLInputElement

    constructor() {
        this.#el = document.querySelector<HTMLInputElement>('#date-range')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#el.addEventListener('terra-change', this.#handleChange.bind(this))
    }

    #setupEffects() {
        effect(() => {
            console.log('datetime range changed: ', dateTimeRange.value)
        })
    }

    #handleChange(e: Event) {
        const datePicker = e.currentTarget as TerraDatePicker

        dateTimeRange.value = {
            startDate: datePicker.selectedDates.startDate,
            endDate: datePicker.selectedDates.endDate,
        }
    }
}
