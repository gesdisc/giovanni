import { Variable } from '../types'

/**
 * Get the valid date range from a list of variables.
 *
 * Given that each variable has a different data product begin and end date, we need to find the latest start date and the earliest end date
 * that are valid for all variables.
 */
export function getValidDateRangeFromVariables(variables: Variable[]) {
    if (variables.length === 0) {
        return {
            minDate: undefined,
            maxDate: undefined,
        }
    }

    const latestStartDate = variables.reduce((latest, current) => {
        return new Date(current.dataProductBeginDateTime) > new Date(latest)
            ? current.dataProductBeginDateTime
            : latest
    }, variables[0].dataProductBeginDateTime)

    const earliestEndDate = variables.reduce((earliest, current) => {
        return new Date(current.dataProductEndDateTime) < new Date(earliest)
            ? current.dataProductEndDateTime
            : earliest
    }, variables[0].dataProductEndDateTime)

    return {
        minDate: latestStartDate,
        maxDate: earliestEndDate,
    }
}

/**
 * Get the valid dates in boundary.
 *
 * Given an existing date and a boundary date, we need to find the valid dates that are within the boundary.
 */
type DateBoundaryResult = {
    startDate: Date | undefined
    endDate: Date | undefined
}

export function getValidDatesInBoundary(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    minDate: Date | string | null | undefined,
    maxDate: Date | string | null | undefined,
): DateBoundaryResult {
    const validateSingleDate = (date: Date | null | undefined, type: 'start' | 'end'): Date | undefined => {
        if (!date && type === 'start' && minDate) {
            return new Date(minDate)
        }

        if (!date && type === 'end' && maxDate) {
            return new Date(maxDate)
        }

        if (!date) {
            return undefined
        }

        // If both boundaries are missing, return the original date
        if (!minDate && !maxDate) {
            return date
        }

        // If date is less than min date, return min date
        if (minDate && date < new Date(minDate)) {
            return new Date(minDate)
        }

        // If date is greater than max date, return max date
        if (maxDate && date > new Date(maxDate)) {
            return new Date(maxDate)
        }

        // If date is within boundaries (or only one boundary exists and date is valid), return original date
        return date
    }

    return {
        startDate: validateSingleDate(startDate ? new Date(startDate) : undefined, 'start'),
        endDate: validateSingleDate(endDate ? new Date(endDate) : undefined, 'end'),
    }
}

/**
 * Get the last N available days from the valid date range.
 * Uses the maxDate as the end date and calculates N days back, ensuring it doesn't go before minDate.
 * If less than N days are available, returns all available days.
 */
export function getLastNAvailableDays(
    minDate: string | undefined,
    maxDate: string | undefined,
    days: number = 7
): { startDate: string; endDate: string } | null {
    if (!maxDate) {
        return null
    }

    const endDate = new Date(maxDate)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (days - 1)) // Subtract (days - 1) to include the end date

    // If minDate is provided and startDate is before it, adjust to minDate
    if (minDate) {
        const min = new Date(minDate)
        if (startDate < min) {
            // If the range is less than N days, use what's available
            if (endDate < min) {
                // No valid range available
                return null
            }
            return {
                startDate: min.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            }
        }
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    }
}
