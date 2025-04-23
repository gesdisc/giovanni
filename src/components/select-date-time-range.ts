import { dateTimeRange } from '../state'
import { DateTimeRange } from '../types'
import { effect } from '@preact/signals-core'

export class SelectDateTimeRangeComponent {
    #startDateEl: HTMLInputElement
    #endDateEl: HTMLInputElement

    constructor(startDateSelector: string, endDateSelector: string) {
        this.#startDateEl = document.querySelector<HTMLInputElement>(startDateSelector)!
        this.#endDateEl = document.querySelector<HTMLInputElement>(endDateSelector)!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#startDateEl.addEventListener('change', this.#handleChange.bind(this))
        this.#endDateEl.addEventListener('change', this.#handleChange.bind(this))
    }

    #setupEffects() {
        effect(() => {
            console.log('datetime range changed: ', dateTimeRange.value)
        })
    }

    #handleChange(e: Event) {
        const input = e.currentTarget as HTMLInputElement
        
        dateTimeRange.value = {
            ...dateTimeRange.value,
            [input.name]: input.value,
        } as DateTimeRange
    }
}
