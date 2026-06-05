import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable } from './helpers'

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
  test('Constraints are lost after logout and login', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    // Set up a query: pick a variable and a date range, then record those values
    // so we can verify they are still there after the simulated login round-trip.
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
    // synchronously (via storeOptionsInLocalStorage) before initiating the redirect.
    // noWaitAfter prevents Playwright from blocking on the EDL navigation we are
    // about to cancel by calling page.goto() immediately below.
    const loginModalButton = page.locator('#login-modal-button')
    await expect(loginModalButton).toBeVisible()
    await loginModalButton.click({ noWaitAfter: true })

    // Simulate returning from a successful Earthdata Login: inject a fake auth token
    // (runs before app scripts on the next load) then navigate straight back to Giovanni,
    // cancelling the in-flight EDL redirect.
    await page.addInitScript(() => {
      localStorage.setItem('terra-token', 'fake-test-token')
    })
    await page.goto('/')
    await dismissSplash(page)

    // After returning from EDL, the constraints should have been restored.
    // FAILS while bug exists (clearOptionsFromLocalStorage wipes terra-options before
    // the async variable restore completes), PASSES when fixed.
    await expect(selectedVarsList).toContainText(variableLabelBefore, { timeout: 15000 })
    await expect(dateInput).toHaveValue(dateBefore, { timeout: 5000 })
  })
})
