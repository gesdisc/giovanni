import { describe, expect, test } from 'vitest'
import { getValidDatesInBoundary } from '../date'

describe('getValidDatesInBoundary', () => {
    test('with no existing date and no boundary date', () => {
        const startDate = null
        const endDate = null
        const minDate = null
        const maxDate = null

        expect(getValidDatesInBoundary(startDate, endDate, minDate, maxDate)).toEqual({
            startDate: undefined,
            endDate: undefined,
        })
    })
    
    test('with no existing date', () => {
        const startDate = null
        const endDate = null
        const minDate = '2021-01-03'
        const maxDate = '2021-01-04'

        expect(getValidDatesInBoundary(startDate, endDate, minDate, maxDate)).toEqual({
            startDate: new Date(minDate),
            endDate: new Date(maxDate),
        })
    })

    test('with existing date before boundary date', () => {
        const startDate = '2021-01-01'
        const endDate = '2021-01-02'
        const minDate = '2021-05-01'
        const maxDate = '2021-05-30'

        expect(getValidDatesInBoundary(startDate, endDate, minDate, maxDate)).toEqual({
            startDate: new Date(minDate),
            endDate: new Date(minDate),
        })
    })

    test('with existing date after boundary date', () => {
        const startDate = '2021-06-03'
        const endDate = '2021-06-04'
        const minDate = '2021-05-01'
        const maxDate = '2021-05-30'

        expect(getValidDatesInBoundary(startDate, endDate, minDate, maxDate)).toEqual({
            startDate: new Date(maxDate),
            endDate: new Date(maxDate),
        })
    })
})
