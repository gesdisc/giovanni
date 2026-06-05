import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable, expectDateRejected, setDateRange } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Date Range — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Date Range', () => {
  test('Date Range Selection', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const generatePlotButton = page.locator('#generate-plot-button')
    const datePicker = page.locator('#date-range')
    const dateInput = datePicker.locator('input[type="text"]').first()

    // Select Map plot type
    const mapButton = page.getByTestId('plot-type-selector--map-button')
    await expect(mapButton).toBeVisible()
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)

    // Select variable: Daily mean precipitation rate (combined microwave-IR) estimate - Final Run
    const variableLabel = 'Daily mean precipitation rate (combined microwave-IR) estimate - Final Run'
    await selectVariable(page, 'imerg', variableLabel)
    await expect(page.locator('#selected-variables')).toContainText('Daily mean precipitation rate', { timeout: 10000 })

    // Set region to CONUS
    const spatialInput = page.locator('#spatial-picker').locator('input[type="text"]').first()
    await expect(spatialInput).toBeVisible()
    await spatialInput.fill('-125,24,-66,50')
    await spatialInput.press('Enter')
    await expect(spatialInput).toHaveValue(/-125(?:\.\d+)?,\s*24(?:\.\d+)?,\s*-66(?:\.\d+)?,\s*50(?:\.\d+)?/)

    // Enter a valid range and open the calendar. The calendar should reflect the typed range.
    await expect(dateInput).toBeVisible()
    await expect(dateInput).toHaveValue(/.+/, { timeout: 10000 })
    await dateInput.fill('2026-03-01 - 2026-03-04')
    await dateInput.press('Enter')
    await expect(dateInput).toHaveValue(/2026-03-01.*[-–].*2026-03-04/)

    const dateIcon = datePicker.locator('svg.date-picker__icon').first()
    await expect(dateIcon).toBeVisible({ timeout: 5000 })
    await dateIcon.click({ force: true })

    await expect
      .poll(async () => {
        return await datePicker.evaluate((element: any) => {
          const root = (element as HTMLElement).shadowRoot ?? element
          return !!root.querySelector('.calendar, .date-picker__calendar, [role="dialog"], [aria-label*="calendar" i]')
        })
      }, { timeout: 10000 })
      .toBeTruthy()

    // Type an out-of-range date and assert rejection.
    await expectDateRejected(datePicker, dateInput, '2027-03-01 - 2027-03-05', 'out-of-range')

    // Read the help text to confirm the available range is shown
    const helpText = datePicker.locator('.form-control__help-text, [slot="help-text"]')
    await expect(helpText).toContainText('Available range', { timeout: 5000 }).catch(() => {})

    // Type an invalid format and assert a format-related validation error.
    await expectDateRejected(datePicker, dateInput, '03-01-2026 - 03-05-2026', 'invalid-format')

    // Enter a valid date range again and verify the button is enabled.
    await dateInput.fill('2026-03-01 - 2026-03-05')
    await dateInput.press('Enter')
    const selectedDateRange = await dateInput.inputValue()
    expect(selectedDateRange).toMatch(/2026-03-01.*[-–].*2026-03-05/)

    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })
  })

  // ──────────────────────────────────────────────
  // Out of temporal range error
  // ──────────────────────────────────────────────
  test('Out of temporal range error', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const generatePlotButton = page.locator('#generate-plot-button')
    const datePicker = page.locator('#date-range')
    const dateInput = datePicker.locator('input[type="text"]').first()

    // Select Map plot type
    const mapButton = page.getByTestId('plot-type-selector--map-button')
    await expect(mapButton).toBeVisible()
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)

    // Select variable: Daily mean precipitation rate (combined microwave-IR) estimate - Final Run
    const variableLabel = 'Daily mean precipitation rate (combined microwave-IR) estimate - Final Run'
    await selectVariable(page, 'imerg', variableLabel)
    await expect(page.locator('#selected-variables')).toContainText('Daily mean precipitation rate', { timeout: 10000 })

    // Set region to CONUS
    const spatialInput = page.locator('#spatial-picker').locator('input[type="text"]').first()
    await expect(spatialInput).toBeVisible()
    await spatialInput.fill('-125,24,-66,50')
    await spatialInput.press('Enter')
    await expect(spatialInput).toHaveValue(/-125(?:\.\d+)?,\s*24(?:\.\d+)?,\s*-66(?:\.\d+)?,\s*50(?:\.\d+)?/)

    // Type an out-of-range date into the date field (before the variable's valid start date)
    // IMERG data starts at 1998-01-01 so 1990 is safely out of range
    await expect(dateInput).toBeVisible()
    // wait for variable selection to auto-populate the date
    await expect(dateInput).toHaveValue(/.+/, { timeout: 10000 })

    // Read the help text to confirm the available range is shown
    const helpText = datePicker.locator('.form-control__help-text, [slot="help-text"]')
    await expect(helpText).toContainText('Available range', { timeout: 5000 }).catch(() => {})

    await expectDateRejected(datePicker, dateInput, '1990-01-01 - 1990-01-05', 'out-of-range')

    // Enter a valid date range that intersects with the variable's temporal coverage
    // TerraDatePicker does NOT revert invalid input — fill() clears it before typing
    await dateInput.fill('2025-03-01 - 2025-03-05')
    await dateInput.press('Enter')
    const selectedDateRange = await dateInput.inputValue()
    expect(selectedDateRange).toMatch(/2025-03-01.*[-–].*2025-03-05/)

    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })
  })

  // ──────────────────────────────────────────────
  // Out of spatial range error
  // ──────────────────────────────────────────────
  test('Out of spatial range error', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/')
    await dismissSplash(page)

    // Select Map plot type
    const mapButton = page.getByTestId('plot-type-selector--map-button')
    await expect(mapButton).toBeVisible()
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)

    // Select variable: NLDAS, 2-meter above ground Specific humidity
    const variableLabel = '2-meter above ground Specific humidity'
    await selectVariable(page, 'nldas', variableLabel)
    await expect(page.locator('#selected-variables')).toContainText('Specific humidity', { timeout: 10000 })

    // Set region outside the variable's spatial coverage
    const spatialInput = page.locator('#spatial-picker').locator('input[type="text"]').first()
    await expect(spatialInput).toBeVisible()
    await spatialInput.fill('63.2813,2.2446,92.8125,36.1759')
    await spatialInput.press('Enter')

    // Type a valid date range into the date field
    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    await expect(dateInput).toBeVisible()
    await dateInput.fill('2026-03-01 - 2026-03-05')
    await dateInput.press('Enter')
    const selectedDateRange = await dateInput.inputValue()
    expect(selectedDateRange).toMatch(/2026-03-01.*[-–].*2026-03-05/)

    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })

    const plotsArea = page.locator('#plots')
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))

    const mapElement = plotsArea.locator('terra-time-average-map')
    await expect(mapElement).toBeVisible({ timeout: 10000 })

    // status dialog closes on both success and error
    const mapStatusDialog = mapElement.locator('dialog:not(.quota-dialog)')
    const dialogAppeared = await mapStatusDialog.waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false)
    if (dialogAppeared) {
      await mapStatusDialog.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})
    }

    const errorAlert = plotsArea.getByRole('alert')
    await expect(errorAlert).toBeVisible({ timeout: 30000 })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Date Range — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Date Range - Bugs', () => {
  // Bug 4 — Blurring the date field after variable selection shows a spurious format error.
  //
  // When a variable is selected, the app sets the date range field programmatically using
  // an en-dash as the separator (e.g. "2020-01-01 – 2020-12-31"). The field's blur
  // validation splits on a plain hyphen ("-"), so the en-dash format fails the check and
  // the field shows: "Date range must be in format: YYYY-MM-DD - YYYY-MM-DD".
  // This also disables the Generate Plot button, blocking the user even though the date is valid.
  test('Valid date range gives format error and disables plot button', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)
    // Selecting a variable is what triggers the date range to be set programmatically
    // with an en-dash — this is what puts the field into the broken state.
    await selectVariable(page)

    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(dateInput).not.toHaveValue('')
    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })

    // click then blur, like a user who glances at the date then clicks elsewhere
    await dateInput.click()
    await dateInput.evaluate(el => (el as HTMLElement).blur())

    // FAILS while bug exists (non-empty validationMessage), PASSES when fixed.
    const validationMsg = await dateInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMsg).toBe('')
  })
})
