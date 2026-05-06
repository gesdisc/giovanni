import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.GIOVANNI_BASE_URL ?? 'http://127.0.0.1:5173/'

// Helper function to dismiss the splash screen
async function dismissSplash(page: Page) {
  const splashScreen = page.locator('#welcomeScreen.splash-overlay')
  if (await splashScreen.isVisible()) {
    await splashScreen.getByRole('button', { name: 'Skip' }).click()
  }
  await expect(splashScreen).toBeHidden({ timeout: 10000 })
}

// Helper function to select a variable
async function selectVariable(page: Page, keyword = 'imerg') {
  const addVarButton = page.locator('terra-button#add-variable-button')
  await addVarButton.scrollIntoViewIfNeeded()
  await addVarButton.click({ force: true })

  const dialog = page.locator('terra-dialog#add-variable-dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })

  const browseVariables = page.locator('terra-browse-variables#variable-selector')
  await expect(browseVariables).toBeVisible()

  const searchInput = page.getByRole('combobox', { name: /Enter search terms/i })
  await expect(searchInput).toBeVisible()
  await page.waitForTimeout(3000)
  await searchInput.fill(keyword)

  const searchButton = page.locator(`[aria-label="Search for ${keyword}."] button, [title="Search for ${keyword}."] button`).first()
  const fallbackBtn = page.getByRole('button', { name: new RegExp(`Search for ${keyword}`, 'i') })
  const searchBtn = await searchButton.isVisible().then(v => v ? searchButton : fallbackBtn)
  await searchBtn.click({ timeout: 10000 })

  const variableItems = browseVariables.locator('li.variable-list-item')
  await expect(variableItems.first()).toBeVisible({ timeout: 30000 })

  await page.locator('terra-variable-keyword-search').evaluate((el: any) => el.close?.()).catch(() => {})

  await variableItems.first().locator('label').click({ force: true })

  const variableDialog = page.locator('terra-dialog#add-variable-dialog')
  if (await variableDialog.isVisible().catch(() => false)) {
    await variableDialog.evaluate((element: any) => element.hide?.()).catch(() => {})
    await expect(variableDialog).toBeHidden({ timeout: 10000 }).catch(() => {})
  }
}

// Regression tests for known Giovanni bugs.
test.describe('GiC Bug Tests', () => {
  test.describe.configure({ timeout: 120_000, retries: 1 })

  // Bug 1 — Splash screen reappears after the Earthdata login redirect.
  //
  // When a logged-out user clicks "Generate Plot", Giovanni saves their "splash dismissed"
  // preference and redirects them to Earthdata Login (EDL). After they authenticate,
  // EDL redirects back to Giovanni, which causes a full page reload. The bug is that
  // the splash screen reappears on this reload even though the user already dismissed it.
  // The fix should persist the dismissed state so it survives the redirect round-trip.
  test('Login should not show splash screen after redirect', async ({ page }) => {
    await page.goto(BASE_URL)

    const splashScreen = page.locator('#welcomeScreen.splash-overlay')

    // Dismiss the splash — clicking Skip saves the preference (to localStorage).
    await expect(splashScreen).toBeVisible({ timeout: 10000 })
    await splashScreen.getByRole('button', { name: 'Skip' }).click()
    await expect(splashScreen).toBeHidden()

    // Simulate the EDL redirect: navigate away (representing the trip to EDL)
    // then come back (representing the return redirect after successful login).
    await page.goto('about:blank')
    await page.goto(BASE_URL)

    // FAILS while bug exists (splash reappears on reload), PASSES when fixed.
    await expect(splashScreen).toBeHidden({ timeout: 10000 })
  })

  // Bug 2 — Variable picker returns no results for plural search terms.
  //
  // Searching for "aerosols" (plural) returns zero results even though searching for
  // "aerosol" (singular) returns many. The search back-end does exact matching and
  // doesn't handle pluralisation. The fix should normalise the query or broaden the
  // search index to cover common plural forms.
  test('a search for "aerosols" in var picker produces no results', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissSplash(page)

    // Open the Add Variable dialog.
    const addVarButton = page.locator('terra-button#add-variable-button')
    await addVarButton.scrollIntoViewIfNeeded()
    await addVarButton.click({ force: true })

    const dialog = page.locator('terra-dialog#add-variable-dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    const browseVariables = page.locator('terra-browse-variables#variable-selector')
    await expect(browseVariables).toBeVisible()

    const searchInput = page.getByRole('combobox', { name: /Enter search terms/i })
    await expect(searchInput).toBeVisible()
    // Wait for the initial variable list to finish loading before typing,
    // otherwise the component may not be ready to accept a search.
    await page.waitForTimeout(3000)

    await searchInput.fill('aerosols')
    // Click the explicit Search button rather than pressing Enter — pressing Enter
    // opens an autocomplete dropdown instead of submitting the search.
    const searchButton = browseVariables.locator('[aria-label="Search for aerosols."] button, [title="Search for aerosols."] button').first()
    const fallbackBtn = page.getByRole('button', { name: /^Search for aerosols\.$/i })
    const btn = await searchButton.isVisible().then(v => v ? searchButton : fallbackBtn)
    await btn.click({ timeout: 10000 })

    const variableItems = browseVariables.locator('li.variable-list-item')
    // First confirm the search actually ran and returned zero results — this rules out
    // a timing issue where we might be checking before results have loaded.
    await expect(variableItems.first()).toBeVisible({ timeout: 10000 })
    await expect(variableItems).toHaveCount(0, { timeout: 15000 })
    // Also verify the status text confirms the query ran for the exact string "aerosols",
    // not silently corrected to the singular form.
    const searchStatus = browseVariables.getByText(/Browsing variables for query `aerosols`/i)
    await expect(searchStatus).toBeVisible({ timeout: 5000 })

    // FAILS while bug exists (zero results returned for the plural form), PASSES when fixed.
    await expect(variableItems.first()).toBeVisible({ timeout: 5000 })
  })

  // Bug 3 — Variable info panel closes when the mouse moves into it.
  //
  // Hovering a variable in the list shows a details panel on the right side of the dialog.
  // The moment the mouse moves from the list item into the info panel, the list item loses
  // hover state, the variable de-highlights, and the info panel disappears. This makes it
  // impossible to read the details or interact with anything in the panel.
  // The fix should keep the panel visible while the mouse is anywhere within it.
  test('Variable info panel stays visible when mouse moves into it', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissSplash(page)

    // Open the variable picker and search so there are list items to hover over.
    const addVarButton = page.locator('terra-button#add-variable-button')
    await addVarButton.scrollIntoViewIfNeeded()
    await addVarButton.click({ force: true })

    const browseVariables = page.locator('terra-browse-variables#variable-selector')
    await expect(browseVariables).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByRole('combobox', { name: /Enter search terms/i })
    await expect(searchInput).toBeVisible()
    await page.waitForTimeout(3000)
    await searchInput.fill('imerg')

    const searchButton = browseVariables.locator('[aria-label="Search for imerg."] button, [title="Search for imerg."] button').first()
    const fallbackSearchBtn = page.getByRole('button', { name: /Search for imerg/i })
    const searchBtn = await searchButton.isVisible().then(v => v ? searchButton : fallbackSearchBtn)
    await searchBtn.click({ timeout: 10000 })

    const firstItem = browseVariables.locator('li.variable-list-item').first()
    await expect(firstItem).toBeVisible({ timeout: 15000 })
    await expect(browseVariables.locator('li.variable-list-item')).not.toHaveCount(0, { timeout: 15000 })

    // Close the keyword autocomplete dropdown if it appeared — it would otherwise
    // intercept hover events and interfere with the test.
    await page.locator('terra-variable-keyword-search').evaluate((el: any) => el.close?.()).catch(() => {})
    const keywordDropdown = page.getByRole('listbox', { name: /Keywords Matching/i })
    if (await keywordDropdown.isVisible()) {
      await page.keyboard.press('Escape')
      await expect(keywordDropdown).toBeHidden({ timeout: 5000 })
    }

    // The placeholder is shown when no variable is being hovered.
    const placeholder = browseVariables.getByText('Hover over a variable to see details')
    await expect(placeholder).toBeVisible()

    // Hover the first variable — the info panel appears and the placeholder hides.
    await firstItem.hover({ force: true })
    await expect(placeholder).toBeHidden({ timeout: 5000 })

    // Now move the mouse into the info panel (right side of the component).
    // Bug: leaving the list item causes it to de-highlight, which closes the info panel.
    const mainPanel = browseVariables.locator('main')
    const mainBox = await mainPanel.boundingBox()
    if (!mainBox) throw new Error('Could not locate variable info panel area')
    await page.mouse.move(mainBox.x + mainBox.width * 0.75, mainBox.y + mainBox.height * 0.3)

    // FAILS while bug exists (panel closes when mouse enters it), PASSES when fixed.
    await expect(placeholder).toBeHidden({ timeout: 3000 })
  })

  // Bug 4 — Blurring the date field after variable selection shows a spurious format error.
  //
  // When a variable is selected, the app sets the date range field programmatically using
  // an en-dash as the separator (e.g. "2020-01-01 – 2020-12-31"). The field's blur
  // validation splits on a plain hyphen ("-"), so the en-dash format fails the check and
  // the field shows: "Date range must be in format: YYYY-MM-DD - YYYY-MM-DD".
  // This also disables the Generate Plot button, blocking the user even though the date is valid.
  test('Valid date range gives format error and disables plot button', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissSplash(page)
    // Selecting a variable is what triggers the date range to be set programmatically
    // with an en-dash — this is what puts the field into the broken state.
    await selectVariable(page)

    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    const generatePlotButton = page.locator('#generate-plot-button')
    // Confirm the date was set and the plot button is initially enabled.
    await expect(dateInput).not.toHaveValue('')
    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })

    // Click the date field then immediately blur it — this is what a user does when they
    // click somewhere else after reviewing the pre-filled dates. It triggers validation.
    await dateInput.click()
    await dateInput.evaluate(el => (el as HTMLElement).blur()) 

    // Read the browser's native validation message directly from the input element.
    // FAILS while bug exists (returns the format error string), PASSES when fixed (empty).
    const validationMsg = await dateInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMsg).toBe('')
  })

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
    const username = process.env.EARTHDATA_USERNAME ?? ''
    const password = process.env.EARTHDATA_PASSWORD ?? ''

    if (!username || !password) {
      test.skip(true, 'EARTHDATA_USERNAME / EARTHDATA_PASSWORD env vars not set — skipping login flow test')
      return
    }

    await page.goto(BASE_URL)
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
    await page.waitForURL(new RegExp(BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // After returning from EDL, the constraints should have been restored.
    await expect(selectedVarsList).toContainText(variableLabelBefore, { timeout: 15000 })
    await expect(dateInput).toHaveValue(dateBefore, { timeout: 5000 })

    // Log out and log back in a second time to check constraints survive that cycle too.
    const loginComponent = page.locator('terra-login#login')
    const logoutButton = loginComponent.locator('terra-button', { hasText: /Log out/i })
    await expect(logoutButton).toBeVisible({ timeout: 10000 })
    await logoutButton.click()

    await page.waitForURL(new RegExp(BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    await loginComponent.click()
    await expect(page).toHaveTitle(/Earthdata Login/i, { timeout: 30000 })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    await page.waitForURL(new RegExp(BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // FAILS while bug exists (variable and date are gone), PASSES when fixed.
    await expect(selectedVarsList).toContainText(variableLabelBefore, { timeout: 15000 })
    await expect(dateInput).toHaveValue(dateBefore, { timeout: 5000 })
  })

  // Bug 6 — History entries disappear when a second plot is generated.
  //
  // After generating a first plot (which adds it to the history panel), generating a
  // second plot causes the first entry to vanish. Root cause: storeTimeSeriesRequestInHistory()
  // and updateHistoryItemThumbnail() both do a read-modify-write on the same IndexedDB key
  // without any locking. When they run concurrently (as they do when a plot completes),
  // one write overwrites the other, deleting entries the other call had just written.
  //
  // Requires EARTHDATA_USERNAME and EARTHDATA_PASSWORD env vars. Skipped without them.
  test('History items are not lost when a second plot is generated', async ({ page }) => {
    const username = process.env.EARTHDATA_USERNAME ?? ''
    const password = process.env.EARTHDATA_PASSWORD ?? ''

    if (!username || !password) {
      test.skip(true, 'EARTHDATA_USERNAME / EARTHDATA_PASSWORD env vars not set — skipping login flow test')
      return
    }

    await page.goto(BASE_URL)
    await dismissSplash(page)

    // Log in first — the history panel only activates for authenticated users.
    const loginComponent = page.locator('terra-login#login')
    await expect(loginComponent).toBeVisible({ timeout: 10000 })
    await loginComponent.click()

    await expect(page).toHaveTitle(/Earthdata Login/i, { timeout: 30000 })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    await page.waitForURL(new RegExp(BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // Wipe the IndexedDB history store so the test starts from a known clean state
    // and any pre-existing entries don't affect the count assertions below.
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('giovanni')
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result
          const tx = db.transaction('history', 'readwrite')
          tx.objectStore('history').clear()
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); reject(tx.error) }
        }
        req.onerror = () => reject(req.error)
      })
    })

    await page.reload()
    await dismissSplash(page)

    const thumbnailsContainer = page.locator('#thumbnails-container')
    const thumbnailItems = thumbnailsContainer.locator('.thumbnail-item')

    // Confirm the history panel is empty before we start.
    await expect(page.locator('#history-panel')).not.toHaveClass(/visible/, { timeout: 10000 })

    // Set up a plot request and generate the first plot.
    await selectVariable(page)

    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    await expect(dateInput).not.toHaveValue('', { timeout: 10000 })

    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })
    await generatePlotButton.click()

    // After the first plot, the history panel should show exactly one entry.
    // Record its data-id so we can check it survives the second plot.
    await expect(page.locator('#history-panel')).toHaveClass(/visible/, { timeout: 15000 })
    await expect(thumbnailItems).toHaveCount(1, { timeout: 15000 })

    const firstItemId = await thumbnailItems.first().getAttribute('data-id')
    expect(firstItemId).toBeTruthy()

    // Generate a second plot.
    await page.waitForTimeout(500)
    await generatePlotButton.click()

    // Both entries should now be present.
    await expect(thumbnailItems).toHaveCount(2, { timeout: 15000 })

    // FAILS while bug exists (first entry overwritten by the concurrent write), PASSES when fixed.
    await expect(thumbnailsContainer.locator(`.thumbnail-item[data-id="${firstItemId}"]`))
      .toBeVisible({ timeout: 5000 })
  })

  // Bug 7 — Drawing a bounding box on the map requires a second click to commit.
  //
  // After clicking the bbox draw button (crosshair cursor appears), the user drags to
  // draw a rectangle. Expected: the selection commits on mouse-up and the coordinate
  // field updates immediately. Actual: mouse-up shows a box outline but the selection
  // is not applied — the user must click again to confirm it.
  //
  // Root cause: Leaflet Draw registers its commit handler on the document
  // (L.DomEvent.on(document, 'mouseup', ...)). The Leaflet canvas lives inside two nested
  // shadow roots (terra-spatial-picker → terra-map). Mouse events that originate inside
  // those shadow roots don't reach document-level listeners, so the commit never fires.
  //
  // How this test reproduces the bug:
  // Playwright's page.mouse.* dispatches CDP-level events directly at the document,
  // bypassing shadow DOM entirely — those always reach Leaflet's listener and can't
  // reproduce the bug. Instead, this test dispatches MouseEvents from inside the shadow
  // root via page.evaluate() with composed: false. Events with composed: false bubble
  // within the shadow root only and cannot escape to the document, so Leaflet Draw's
  // commit handler never fires — exactly mimicking the real broken path.
  test('BBox drag on map commits the selection on mouse-up without a second click', async ({ page }) => {
    await page.goto(BASE_URL)
    await dismissSplash(page)

    const spatialPicker = page.locator('#spatial-picker')
    await expect(spatialPicker).toBeVisible({ timeout: 10000 })

    // Open the map panel. The map icon button is inside the terra-spatial-picker shadow
    // root and can't be reached directly by Playwright, so dispatch the click via evaluate().
    await spatialPicker.evaluate((el: any) => {
      const icon = el.querySelector?.('svg.spatial-picker__input_icon[slot="suffix"]') as HTMLElement | null
        ?? el.shadowRoot?.querySelector('svg.spatial-picker__input_icon[slot="suffix"]') as HTMLElement | null
      icon?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
    })

    const mapContainer = spatialPicker.locator('.spatial-picker__map-container')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
    await expect(mapContainer.locator('.leaflet-container')).toBeVisible({ timeout: 10000 })

    // Record the current coordinate value so we can detect whether the drag committed.
    const spatialInput = spatialPicker.locator('input[type="text"]').first()
    const valueBefore = await spatialInput.inputValue()

    // Activate the bbox draw tool. The button is inside terra-map's shadow root,
    // so it must also be clicked via evaluate().
    await spatialPicker.evaluate((el: any) => {
      const terraMap = el.shadowRoot?.querySelector('terra-map') ?? el.querySelector?.('terra-map')
      const btn = terraMap?.shadowRoot?.querySelector('.leaflet-draw-draw-rectangle') as HTMLElement | null
      if (!btn) throw new Error('leaflet-draw-draw-rectangle button not found in shadow DOM')
      btn.click()
    })

    // Wait for the crosshair cursor — this confirms Leaflet Draw is in rectangle-draw mode.
    await expect.poll(async () => {
      return spatialPicker.evaluate((el: any) => {
        const terraMap = el.shadowRoot?.querySelector('terra-map') ?? el.querySelector?.('terra-map')
        const mapDiv = terraMap?.shadowRoot?.querySelector('#map') as HTMLElement | null
        return mapDiv ? window.getComputedStyle(mapDiv).cursor : ''
      })
    }, { timeout: 10000, message: 'Draw mode crosshair cursor should appear' })
      .toMatch(/crosshair/)

    // Dispatch the drag gesture from inside the shadow root with composed: false.
    // composed: false means these events stay within the shadow root and cannot reach
    // the document — so Leaflet Draw's document-level mouseup listener never fires.
    // This is the exact failure mode of the real bug.
    const dragOk = await spatialPicker.evaluate((el: any): boolean => {
      const terraMap = el.shadowRoot?.querySelector('terra-map') ?? el.querySelector?.('terra-map')
      const leafletContainer = terraMap?.shadowRoot?.querySelector('.leaflet-container') as HTMLElement | null
      if (!leafletContainer) return false

      const rect = leafletContainer.getBoundingClientRect()
      const startX = rect.left + rect.width  * 0.25
      const startY = rect.top  + rect.height * 0.25
      const endX   = rect.left + rect.width  * 0.75
      const endY   = rect.top  + rect.height * 0.75

      const fire = (type: string, x: number, y: number, buttons: number) =>
        leafletContainer.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          composed: false,   // stays within shadow root — document-level listener never fires
          cancelable: true,
          clientX: x,
          clientY: y,
          buttons,
          button: 0,
        }))

      fire('mousedown', startX, startY, 1)
      for (let i = 1; i <= 10; i++) {
        fire('mousemove',
          startX + (endX - startX) * (i / 10),
          startY + (endY - startY) * (i / 10),
          1)
      }
      fire('mouseup', endX, endY, 0)
      return true
    })

    expect(dragOk).toBe(true)

    // Give any pending event callbacks time to run (if they were going to).
    await page.waitForTimeout(800)

    // FAILS while bug exists: mouseup blocked at shadow root → draw:created never fires
    //   → terra-map-change never fires → coordinate field value unchanged.
    // PASSES when fixed: mouseup handled within the shadow root → draw commits → value updated.
    await expect(spatialInput).not.toHaveValue(valueBefore, { timeout: 3000 })

    // Also verify the new value is a well-formed 4-part bbox coordinate string.
    const valueAfter = await spatialInput.inputValue()
    const parts = valueAfter.split(',').map(s => parseFloat(s.trim()))
    expect(parts).toHaveLength(4)
    expect(parts.every(n => !isNaN(n))).toBe(true)
  })
})
