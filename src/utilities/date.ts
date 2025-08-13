import { Variable } from "../types"

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
        return new Date(current.dataProductBeginDateTime) > new Date(latest) ? current.dataProductBeginDateTime : latest
    }, variables[0].dataProductBeginDateTime)

    const earliestEndDate = variables.reduce((earliest, current) => {
        return new Date(current.dataProductEndDateTime) < new Date(earliest) ? current.dataProductEndDateTime : earliest
    }, variables[0].dataProductEndDateTime)

    return {
        minDate: latestStartDate,
        maxDate: earliestEndDate,
    }
}

/**
 * Get the valid date in boundary.
 * 
 * Given an existing date and a boundary date, we need to find the valid date that is within the boundary.
 */
export function getValidDateInBoundary(
    existingDate: string | null | undefined, 
    boundaryDate: string | null | undefined, 
    type: 'start' | 'end' // 'start' means the date has to be after the start date, 'end' means the date has to be before the end date
) {
    if (!boundaryDate) {
        // we don't have a boundary date. This shouldn't normally happen but in the case of metadata issues
        // we'll just return the existing date
        return existingDate;
    }

    if (!existingDate) {
        // we don't have an existing date, so we'll return the boundary date
        return boundaryDate;
    }

    const existing = new Date(existingDate);
    const boundary = new Date(boundaryDate);
    
    const isInvalid = type === 'start' ? existing < boundary : existing > boundary;
    
    if (isInvalid) {
        // the existing date is invalid! it's outside of the boundary
        // so we'll return the boundary date
        return boundaryDate;
    }

    // the existing date is valid, so we can return it as is
    return existingDate;
}