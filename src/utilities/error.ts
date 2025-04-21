/**
 * Assert function that works in browser environments
 * Will throw the provided error if the value is falsy
 */
export function assert(value: any, message: string | Error): asserts value {
    if (value) {
        // value is truthy, return early
        return
    }

    if (message instanceof Error) {
        throw message
    } else {
        throw new Error(message || 'Assertion failed')
    }
}
