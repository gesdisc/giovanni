import { beforeAll, describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { dismissModalIfPresent } from './test-utils'

describe('Sidebar', () => {
    beforeAll(async () => {
        await dismissModalIfPresent()
    })

    describe('Plot Type Selector', () => {
        test('is on the page', async () => {
            await expect.element(page.getByTestId('plot-type-selector--map-button')).toBeInTheDocument()
            await expect.element(page.getByTestId('plot-type-selector--plot-button')).toBeInTheDocument()
        })

        test('default plot type is plot', async () => {
            await expect.element(page.getByTestId('plot-type-selector--plot-button')).toHaveClass('plot-type-button--selected')
        })
    })

    /*
    render() // mount DOM elements

  // Asserts initial state.
  await expect.element(page.getByText('Hi, my name is Alice')).toBeInTheDocument()

  // Get the input DOM node by querying the associated label.
  const usernameInput = page.getByLabelText(/username/i)

  // Type the name into the input. This already validates that the input
  // is filled correctly, no need to check the value manually.
  await usernameInput.fill('Bob')

  await expect.element(page.getByText('Hi, my name is Bob')).toBeInTheDocument()
})*/
})
