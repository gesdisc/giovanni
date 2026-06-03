import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable, requireEarthdataCredentials } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Authentication — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Auth - Bugs', () => {
  // Bug 5 — Query constraints (selected variable + date range) are lost after login.
  //
  // Steps to reproduce: pick a variable and set a date range, then click "Generate Plot"
  // while logged out. Giovanni prompts you to log in, saves your constraints to
  // localStorage, and redirects to Earthdata Login. After you log in and return, the
  // variable and dates are gone. Root cause: clearOptionsFromLocalStorage() fires as soon
  // as the login state is confirmed, before the async variable lookup from the saved IDs
  // has finished restoring the constraints — so the restore is wiped before it completes.
  //
  // Requires EARTHDATA_USERNAME and EARTHDATA_PASSWORD env vars. Skipped without them.
  test('Constraints are lost after logout and login', async ({ page }) => {
    const creds = requireEarthdataCredentials(test)
    if (!creds) return
    const { username, password } = creds

    // Keep a local reference to the base URL for waitForURL regex matching.
    const baseUrl = process.env.GIOVANNI_BASE_URL ?? 'http://127.0.0.1:5173/'

    await page.goto('/')
    await dismissSplash(page)

    // Set up a query: pick a variable and a date range, then record those values
    // so we can verify they are still there after the login round-trip.
    await selectVariable(page)

    const selectedVarsList = page.locator('#selected-variables')
    await expect(selectedVarsList).not.toContainText('No variables selected yet', { timeout: 10000 })
    const variableLabelBefore = await selectedVarsList.innerText()

    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    await dateInput.fill('2020-01-01 - 2020-01-31')
    await dateInput.evaluate(el => (el as HTMLElement).blur())
    const dateBefore = await dateInput.inputValue()

    // Click Generate Plot — because the user isn't logged in, this shows the login overlay.
    const generatePlotButton = page.locator('#generate-plot-button')
    await generatePlotButton.click()

    const loginOverlay = page.locator('#login-overlay')
    await expect(loginOverlay).toBeVisible({ timeout: 10000 })

    // Click the modal login button — this saves the constraints to localStorage
    // and redirects to Earthdata Login.
    const loginModalButton = page.locator('#login-modal-button')
    await expect(loginModalButton).toBeVisible()
    await loginModalButton.click()

    // Complete the EDL login form.
    await expect(page).toHaveTitle(/Earthdata Login/i, { timeout: 30000 })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForURL(new RegExp(baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // After returning from EDL, the constraints should have been restored.
    await expect(selectedVarsList).toContainText(variableLabelBefore, { timeout: 15000 })
    await expect(dateInput).toHaveValue(dateBefore, { timeout: 5000 })

    // Log out and log back in a second time to check constraints survive that cycle too.
    const loginComponent = page.locator('terra-login#login')
    const logoutButton = loginComponent.locator('terra-button', { hasText: /Log out/i })
    await expect(logoutButton).toBeVisible({ timeout: 10000 })
    await logoutButton.click()

    await page.waitForURL(new RegExp(baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    await loginComponent.click()
    await expect(page).toHaveTitle(/Earthdata Login/i, { timeout: 30000 })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    await page.waitForURL(new RegExp(baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // FAILS while bug exists (variable and date are gone), PASSES when fixed.
    await expect(selectedVarsList).toContainText(variableLabelBefore, { timeout: 15000 })
    await expect(dateInput).toHaveValue(dateBefore, { timeout: 5000 })
  })
})
