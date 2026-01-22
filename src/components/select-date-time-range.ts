import { dateTimeRange, validDateTimeRange, variables } from '../state'
import { effect, untracked } from '@preact/signals-core'
import { TerraDatePicker, TerraDateRangeChangeEvent } from '@nasa-terra/components'
import { getValidDatesInBoundary } from '../utilities/date'

export class SelectDateTimeRangeComponent {
    #el: TerraDatePicker

    constructor() {
        this.#el = document.querySelector<TerraDatePicker>('#date-range')!

        // Set initial enableTime value if variables are already selected
        this.#el.enableTime = variables.value.some(v => 
            v.variable.dataProductTimeInterval?.toLowerCase().includes('hour')
        )

        this.#bindEvents()
        this.#setupEffects()
    }

    #bindEvents() {
        this.#el.addEventListener('terra-date-range-change', this.#handleChange.bind(this))
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
            // Enable time selection if there is any variable with hourly data
            this.#el.enableTime = variables.value.some(v => 
                v.variable.dataProductTimeInterval?.toLowerCase().includes('hour')
            )
        })
        
        effect(() => {
            if (validDateTimeRange.value.minDate && validDateTimeRange.value.maxDate) {
                this.#el.minDate = validDateTimeRange.value.minDate
                this.#el.maxDate = validDateTimeRange.value.maxDate

                /**
                 * Cloud Giovanni let's a user choose one or more variables, each with a different temporal range
                 * We need to make sure that the date picker is always set to a valid range, and that the user can't select a date that is outside of the valid range
                 * 
                 * This effect is used to ensure that the date picker is always set to a valid range, and that the user can't select a date that is outside of the valid range
                 * 
                 * It's important to note that this effect is not triggered by the user changing the date picker, but rather by the variables changing
                 */
                untracked(() => { // use untracked, as we don't want to trigger a re-render of the date picker here
                    if (!dateTimeRange.value?.startDate || !dateTimeRange.value?.endDate) {
                        // user hasn't made a selection yet, so we don't need to do anything
                        return
                    }
                    
                    const newDateTimeRange = getValidDatesInBoundary(
                        dateTimeRange.value.startDate, 
                        dateTimeRange.value.endDate,
                        validDateTimeRange.value.minDate,
                        validDateTimeRange.value.maxDate,
                    )

                    if (newDateTimeRange.startDate && newDateTimeRange.endDate) {
                        console.log('new date time range: ', newDateTimeRange)

                        // Preserve time if time selection is enabled
                        const preserveTime = this.#el.enableTime
                        dateTimeRange.value = {
                            startDate: preserveTime 
                                ? newDateTimeRange.startDate.toISOString()
                                : newDateTimeRange.startDate.toISOString().split('T')[0],
                            endDate: preserveTime
                                ? newDateTimeRange.endDate.toISOString()
                                : newDateTimeRange.endDate.toISOString().split('T')[0],
                        }
                    }
                })
            }
        })

        effect(() => {
            // Update help text based on available date range from variables
            this.#updateHelpText()
        })
    }

    #handleChange(e: TerraDateRangeChangeEvent) {
        dateTimeRange.value = {
            startDate: e.detail.startDate,
            endDate: e.detail.endDate,
        }
    }

    #updateHelpText() {
        if (variables.value.length === 0) {
            this.#el.helpText = ''
            return
        }

        const { minDate, maxDate } = validDateTimeRange.value
        
        if (minDate && maxDate) {
            // Format dates for display (YYYY-MM-DD format)
            const formatDate = (date: string | Date) => {
                const d = new Date(date)
                return d.toISOString().split('T')[0]
            }
            
            this.#el.helpText = `Available range: ${formatDate(minDate)} to ${formatDate(maxDate)}`
        } else {
            this.#el.helpText = ''
        }
    }
}
