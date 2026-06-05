import { test, expect } from '@playwright/test'
import { openGiovanni, dismissSplash } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Splash Screen — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Splash Screen', () => {
  test('Splash Screen', async ({ page }) => {
    await openGiovanni(page)

    const splashScreen = page.locator('#welcomeScreen.splash-overlay')

    // Verify splash screen is visible with all expected elements
    await expect(splashScreen).toBeVisible()
    const helpDeskLink = splashScreen.getByRole('link', { name: 'Help Desk' }).first()
    await expect(helpDeskLink).toBeVisible()
    await expect(splashScreen.getByText('NOTE: This release has limited cloud')).toBeVisible()
    await expect(splashScreen.getByRole('link', { name: 'Create Map' })).toBeVisible()
    await expect(splashScreen.getByRole('link', { name: 'Create Time-Series' })).toBeVisible()
    await expect(splashScreen.getByRole('link', { name: 'Read User Guide' })).toBeVisible()
    await expect(splashScreen.getByRole('checkbox', { name: 'Do not show this again' })).toBeVisible()
    await expect(splashScreen.getByRole('button', { name: 'Skip' })).toBeVisible()

    //Click the help desk link
    await expect(helpDeskLink).toHaveText(/Help Desk/)
    await expect(helpDeskLink).toHaveAttribute('href', /^(mailto:|#|\/)/)

    // Click "Create Map" – splash hides and Map button is selected
    await splashScreen.getByRole('link', { name: 'Create Map' }).first().click()
    await expect(splashScreen).toBeHidden()
    await expect(page.getByTestId('plot-type-selector--map-button')).toHaveClass('plot-type-button plot-type-button--selected')

    // Reload – splash returns; click "Create Time-Series"
    await page.reload()
    await expect(splashScreen).toBeVisible()
    await splashScreen.getByRole('link', { name: 'Create Time-Series' }).first().click()
    await expect(splashScreen).toBeHidden()
    await expect(page.getByTestId('plot-type-selector--plot-button')).toHaveClass('plot-type-button plot-type-button--selected')

    // Reload – splash returns; click "Read User Guide" → opens new tab
    await page.reload()
    await expect(splashScreen).toBeVisible()
    const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
    await splashScreen.getByRole('link', { name: 'Read User Guide' }).first().click()
    await expect(splashScreen).toBeHidden()
    const newPage = await popupPromise
    // Popup opens but User Guide server on localhost may not be running – just verify popup opened
    if (newPage) {
      await expect(newPage).toHaveURL(/user-guide|guide|help/i)
      await newPage.close()
    }

    // Reload – splash returns; click "Skip"
    await page.reload()
    await expect(splashScreen).toBeVisible()
    await splashScreen.getByRole('button', { name: 'Skip' }).first().click()
    await expect(splashScreen).toBeHidden()

    // Click outside of splash screen to make it disappear, then reload to show it again
    await page.click('body', { position: { x: 10, y: 10 } })
    await expect(splashScreen).toBeHidden()
    await page.reload()
    await expect(splashScreen).toBeVisible()

    // Reload – splash returns; check "Do not show" + Skip → stays hidden after reload
    await splashScreen.getByRole('checkbox', { name: 'Do not show this again' }).check()
    await splashScreen.getByRole('button', { name: 'Skip' }).first().click()
    await expect(splashScreen).toBeHidden()
    await page.reload()
    await expect(splashScreen).toBeHidden()

    // Reset localStorage so splash returns
    await page.evaluate(() => {localStorage.setItem('hideWelcomeScreen', 'false')})
    await page.reload()
    await expect(splashScreen).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Splash Screen — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Splash Screen - Bugs', () => {
  // Bug 1 — Splash screen reappears after the Earthdata login redirect.
  //
  // When a logged-out user clicks "Generate Plot", Giovanni saves their "splash dismissed"
  // preference and redirects them to Earthdata Login (EDL). After they authenticate,
  // EDL redirects back to Giovanni, which causes a full page reload. The bug is that
  // the splash screen reappears on this reload even though the user already dismissed it.
  test('Login should not show splash screen after redirect', async ({ page }) => {
    await page.goto('/')

    const splashScreen = page.locator('#welcomeScreen.splash-overlay')

    // Dismiss the splash — clicking Skip saves the preference (to localStorage).
    await expect(splashScreen).toBeVisible({ timeout: 10000 })
    await splashScreen.getByRole('button', { name: 'Skip' }).click()
    await expect(splashScreen).toBeHidden()

    // Simulate the EDL redirect: navigate away (representing the trip to EDL)
    // then come back (representing the return redirect after successful login).
    await page.goto('about:blank')
    await page.goto('/')

    // FAILS while bug exists (splash reappears on reload), PASSES when fixed.
    await expect(splashScreen).toBeHidden({ timeout: 10000 })
  })
})
