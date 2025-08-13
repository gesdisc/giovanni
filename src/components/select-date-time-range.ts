import { dateTimeRange, validDateTimeRange } from '../state'
import { effect, untracked } from '@preact/signals-core'
import { TerraDatePicker } from '@nasa-terra/components'
import { getValidDateInBoundary } from '../utilities/date'

export class SelectDateTimeRangeComponent {
    #el: TerraDatePicker

    constructor() {
        this.#el = document.querySelector<TerraDatePicker>('#date-range')!

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#el.addEventListener('terra-change', this.#handleChange.bind(this))
    }

    #setupEffects() {
        effect(() => {
            console.log('date time range changed: ', dateTimeRange.value)
        
            if (dateTimeRange.value?.startDate && dateTimeRange.value.endDate) {
                this.#el.startDate = dateTimeRange.value.startDate
                this.#el.endDate = dateTimeRange.value.endDate
            }
        })
        
        effect(() => {
            if (validDateTimeRange.value.minDate && validDateTimeRange.value.maxDate) {

                /**
                 * Cloud Giovanni let's a user choose one or more variables, each with a different temporal range
                 * We need to make sure that the date picker is always set to a valid range, and that the user can't select a date that is outside of the valid range
                 * 
                 * This effect is used to ensure that the date picker is always set to a valid range, and that the user can't select a date that is outside of the valid range
                 * 
                 * It's important to note that this effect is not triggered by the user changing the date picker, but rather by the variables changing
                 */
                untracked(() => { // use untracked, as we don't want to trigger a re-render of the date picker here
                    let newDateTimeRange = {
                        startDate: getValidDateInBoundary(dateTimeRange.value?.startDate, validDateTimeRange.value.minDate, 'start'),
                        endDate: getValidDateInBoundary(dateTimeRange.value?.endDate, validDateTimeRange.value.maxDate, 'end'),
                    }

                    if (newDateTimeRange.startDate && newDateTimeRange.endDate) {
                        console.log('new date time range: ', newDateTimeRange)

                        dateTimeRange.value = {
                            startDate: newDateTimeRange.startDate,
                            endDate: newDateTimeRange.endDate,
                        }
                    }
                })
            }
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
