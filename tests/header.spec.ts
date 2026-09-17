import { test, expect } from './fixtures'
import { dismissSplash } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Header — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Header', () => {
  test('Header', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('terra-site-header')
    await expect(header).toBeVisible()

    // Sidebar, workspace, and splash are visible
    await expect(page.locator('aside#sidebar')).toBeVisible()
    await expect(page.locator('main').first()).toBeVisible()

    const splashScreen = page.locator('#welcomeScreen.splash-overlay')
    await expect(splashScreen).toBeVisible()
    await expect(splashScreen).toHaveCSS('justify-content', 'center')

    // NASA logo
    const nasaLogoIcon = page.locator('terra-icon[name="nasa-logo"][aria-hidden="true"]')
    await expect(nasaLogoIcon).toBeVisible()

    // Identity and slogan
    const giovanniTitle = header.locator('h1')
    await expect(giovanniTitle).toBeVisible()
    await expect(giovanniTitle).toContainText('Giovanni')

    const slogan = header.locator('p.inter-italic')
    await expect(slogan).toBeVisible()
    await expect(slogan).toContainText('The bridge between data and science')

    // Help button and login
    const helpButton = page.locator('terra-button:has-text("Help")')
    await expect(helpButton).toBeVisible()

    // The real `terra-login` component starts hidden (display:none) behind a
    // visible proxy button (#login-proxy) until the user initiates login.
    const loginProxyButton = page.locator('#login-proxy')
    await expect(loginProxyButton).toBeVisible()

    // Dismiss splash then open help menu
    await splashScreen.getByRole('button', { name: 'Skip' }).click()
    await helpButton.click()
    const helpMenu = page.locator('#helpMenu')
    await expect(helpMenu).toBeVisible()
    await expect(helpMenu.locator('a:has-text("User Guide")')).toBeVisible()
    await expect(helpMenu.locator('a:has-text("Earthdata Forum")')).toBeVisible()

    // Verify clicking the login button redirects to Earthdata Login
    await loginProxyButton.click()
    await expect(page).toHaveTitle('Earthdata Login')
  })
})
