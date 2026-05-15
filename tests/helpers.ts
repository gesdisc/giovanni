import { expect, Page, Locator } from '@playwright/test'

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to Giovanni and ensure the splash screen is shown. */
export async function openGiovanni(page: Page) {
  const BASE_URL = process.env.GIOVANNI_BASE_URL ?? 'http://127.0.0.1:5173/'
  await page.goto(BASE_URL)
  await page.evaluate(() => { localStorage.removeItem('hideWelcomeScreen') })
  await page.reload()
}

// ---------------------------------------------------------------------------
// Splash screen
// ---------------------------------------------------------------------------

/**
 * Dismiss the splash screen if it is visible, then persist the preference so
 * component remounts mid-test don't re-show the overlay.
 */
export async function dismissSplash(page: Page) {
  const splashScreen = page.locator('#welcomeScreen.splash-overlay')
  if (await splashScreen.isVisible()) {
    const hideCheckbox = splashScreen.getByRole('checkbox', { name: 'Do not show this again' })
    if (await hideCheckbox.isVisible().catch(() => false)) {
      await hideCheckbox.check().catch(() => {})
    }
    await splashScreen.getByRole('button', { name: 'Skip' }).click()
  }

  // Persist hiding to prevent remounts from re-showing the overlay mid-test.
  await page.evaluate(() => { localStorage.setItem('hideWelcomeScreen', 'true') })
  await expect(splashScreen).toBeHidden({ timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Variable selection
// ---------------------------------------------------------------------------

/**
 * Select a variable via the keyword search dialog.
 *
 * @param keyword    Search term (default: 'imerg').
 * @param exactLabel When provided, clicks the first list item whose text
 *                   matches exactly, rather than the first item overall.
 */
export async function selectVariable(page: Page, keyword = 'imerg', exactLabel?: string) {
  const selectVariableButton = page.locator('terra-button#add-variable-button')
  await selectVariableButton.scrollIntoViewIfNeeded()
  await selectVariableButton.click({ force: true })

  const dialog = page.locator('terra-dialog#add-variable-dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })

  const browseVariables = page.locator('terra-browse-variables#variable-selector')
  await expect(browseVariables).toBeVisible()

  const searchInput = page.getByRole('combobox', { name: /Enter search terms/i })
  await expect(searchInput).toBeVisible()

  // Wait for the search input to become interactive before typing.
  // Using a short poll instead of a fixed sleep so fast machines don't wait unnecessarily.
  await expect.poll(
    async () => {
      const disabled = await searchInput.getAttribute('disabled')
      const readOnly = await searchInput.getAttribute('readonly')
      return disabled === null && readOnly === null
    },
    { timeout: 10000, message: 'Search input should become enabled' }
  ).toBeTruthy()

  await searchInput.fill(keyword)

  // Click the search button directly rather than relying on the keyword
  // autocomplete dropdown (which depends on a flaky keyword suggestions API).
  const searchButton = page.locator(`[aria-label="Search for ${keyword}."] button, [title="Search for ${keyword}."] button`).first()
  const fallbackSearchButton = page.getByRole('button', { name: new RegExp(`Search for ${keyword}`, 'i') })
  const searchBtn = await searchButton.isVisible().then(v => v ? searchButton : fallbackSearchButton)
  await searchBtn.click({ timeout: 10000 })

  // Wait for the keyword search API to respond and render variable results.
  const variableList = browseVariables.locator('ul.variable-list')
  await expect(variableList).toBeVisible({ timeout: 30000 })
  await expect(variableList.locator('li.variable-list-item').first()).toBeVisible({ timeout: 10000 })

  // Close the keyword dropdown so it doesn't cover variables.
  await page.locator('terra-variable-keyword-search').evaluate((el: any) => el.close?.()).catch(() => {})
  const keywordDropdown = page.getByRole('listbox', { name: /Keywords Matching/i })
  await expect(keywordDropdown).toBeHidden({ timeout: 10000 })
  await expect(dialog).toBeVisible({ timeout: 10000 })

  const variableItems = browseVariables.locator('li.variable-list-item')
  await expect(variableItems.first()).toBeVisible({ timeout: 10000 })

  const variableToClick = exactLabel
    ? browseVariables.locator('li.variable-list-item', { hasText: exactLabel }).first()
    : variableItems.first()

  if (exactLabel) {
    await expect(variableToClick).toBeVisible({ timeout: 10000 })
  }

  await variableToClick.locator('label').click({ force: true })

  const variableDialog = page.locator('terra-dialog#add-variable-dialog')
  if (await variableDialog.isVisible().catch(() => false)) {
    await variableDialog.evaluate((element: any) => element.hide?.()).catch(() => {})
    await expect(variableDialog).toBeHidden({ timeout: 10000 }).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Date range validation helpers
// ---------------------------------------------------------------------------

/**
 * Fill the date input with an invalid range and assert that the picker rejects it.
 * Pass `pattern` to distinguish which kind of rejection to expect:
 *   - 'out-of-range'    → "must be on or after/before" error
 *   - 'invalid-format'  → "format / yyyy / invalid / date range" error
 */
export async function expectDateRejected(
  datePicker: Locator,
  dateInput: Locator,
  invalidRange: string,
  pattern: 'out-of-range' | 'invalid-format'
) {
  const regex = pattern === 'out-of-range'
    ? /must be on or (after|before)/i
    : /format|yyyy|invalid|date range/i

  await dateInput.fill(invalidRange)
  await dateInput.press('Enter')

  await expect
    .poll(async () => {
      const hasInputValidationSignal = await dateInput.evaluate((input: HTMLInputElement, re: string) => {
        const pattern = new RegExp(re, 'i')
        if (input.validationMessage && pattern.test(input.validationMessage)) return true
        if (input.getAttribute('aria-invalid') === 'true') return true
        const root = input.getRootNode() as ShadowRoot
        const errorEl = root?.querySelector?.('.form-control__error-text')
        return !!(errorEl?.textContent && pattern.test(errorEl.textContent))
      }, regex.source)

      const hasPickerErrorText = await datePicker
        .innerText()
        .then((text) => new RegExp(regex.source, 'i').test(text))
        .catch(() => false)

      // For out-of-range, also accept the picker leaving the input unchanged.
      const inputValue = (await dateInput.inputValue()).trim()
      const unchanged = pattern === 'out-of-range' && inputValue === invalidRange

      return hasInputValidationSignal || hasPickerErrorText || unchanged
    }, { timeout: 10000 })
    .toBeTruthy()
}

// ---------------------------------------------------------------------------
// Date range setter (programmatic)
// ---------------------------------------------------------------------------

export async function setDateRange(datePicker: Locator, dateInput: Locator, startDate: string, endDate: string) {
  await datePicker.evaluate((element, range) => {
    const picker = element as any
    picker.startDate = range.startDate
    picker.endDate = range.endDate
    picker.dispatchEvent(new CustomEvent('terra-date-range-change', {
      detail: range,
      bubbles: true,
      composed: true,
    }))
  }, { startDate, endDate })

  await expect(dateInput).toHaveValue(new RegExp(`${startDate}.*[-–].*${endDate}`), { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Plot type setter
// ---------------------------------------------------------------------------

export async function setPlotType(page: Page, newPlotType: 'map' | 'plot') {
  await page.evaluate((plotType) => {
    document.dispatchEvent(new CustomEvent('plot-type-changed', {
      detail: { plotType }
    }))

    const state = (window as any).__debugPlotTypeSetter
    if (typeof state === 'function') {
      state(plotType)
      return
    }

    const button = document.querySelector<HTMLButtonElement>(plotType === 'map' ? '#map-button' : '#plot-button')
    button?.click()
  }, newPlotType)
}

// ---------------------------------------------------------------------------
// Earthdata credentials helper
// ---------------------------------------------------------------------------

/**
 * Read EARTHDATA_USERNAME / EARTHDATA_PASSWORD from the environment.
 * Returns `null` and calls `test.skip()` when either is missing.
 */
export function requireEarthdataCredentials(test: { skip: (condition: boolean, reason: string) => void }) {
  const username = process.env.EARTHDATA_USERNAME ?? ''
  const password = process.env.EARTHDATA_PASSWORD ?? ''
  if (!username || !password) {
    test.skip(true, 'EARTHDATA_USERNAME / EARTHDATA_PASSWORD env vars not set — skipping login flow test')
    return null
  }
  return { username, password }
}
