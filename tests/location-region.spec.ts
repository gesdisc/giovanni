import { test, expect } from '@playwright/test'
import { dismissSplash } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Location / Region — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Location / Region', () => {
  test('Location / Region Selection', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    // Heading says "Location / Region" when plot type is Time Series
    const heading = page.locator('#spatial-picker-heading')
    await expect(heading).toContainText('Location / Region')

    // Switch to Map – heading changes to "Region"
    await page.getByTestId('plot-type-selector--map-button').click()
    await expect(heading).toContainText('Region')
    await expect(heading).not.toContainText('Location / Region')

    // Switch back to Time Series – heading shows "Location / Region" again
    await page.getByTestId('plot-type-selector--plot-button').click()
    await expect(heading).toContainText('Location / Region')

    // Spatial picker element is present
    const spatialPicker = page.locator('#spatial-picker')
    await expect(spatialPicker).toBeVisible()

    // Verify the spatial picker has an input
    const spatialInput = spatialPicker.locator('input[type="text"]').first()
    await expect(spatialInput).toBeVisible()

    // Click before fill — the map icon slot element only renders after real user interaction.
    await spatialInput.click()
    await spatialInput.fill('-33,-33,33,33')
    await spatialInput.press('Enter')
    await expect(spatialInput).toHaveValue(/-33(?:\.\d+)?,\s*-33(?:\.\d+)?,\s*33(?:\.\d+)?,\s*33(?:\.\d+)?/)

    // Then open the map UI.
    const mapIcon = spatialPicker.locator('svg.spatial-picker__input_icon[slot="suffix"]')
    // SVG slot can take a moment to appear after the value commits, especially on prod.
    await expect(mapIcon).toBeAttached({ timeout: 15000 })
    await spatialPicker.evaluate((element: any) => {
      const icon = element.querySelector('svg.spatial-picker__input_icon[slot="suffix"]') as HTMLElement | null
      icon?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
    })

    const mapContainer = spatialPicker.locator('.spatial-picker__map-container')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
    await expect(mapContainer.locator('.leaflet-container')).toBeVisible({ timeout: 10000 })

    // Verify the map rendered the region selection primitives (attached in DOM).
    const overlayCandidates = mapContainer.locator('.leaflet-overlay-pane path, path.leaflet-interactive')
    await expect(overlayCandidates.first()).toBeAttached({ timeout: 10000 })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Location / Region — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Location / Region - Bugs', () => {
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
    await page.goto('/')
    await dismissSplash(page)

    const spatialPicker = page.locator('#spatial-picker')
    await expect(spatialPicker).toBeVisible({ timeout: 10000 })

    // map icon slot only appears after the input has a value, so fill it first
    const spatialInput = spatialPicker.locator('input[type="text"]').first()
    await spatialInput.fill('-90,-45,90,45')
    await spatialInput.press('Enter')

    // guard with toBeAttached before clicking — slot renders asynchronously,
    // and evaluate() is needed to reach through the shadow DOM
    const mapIcon = spatialPicker.locator('svg.spatial-picker__input_icon[slot="suffix"]')
    await expect(mapIcon).toBeAttached({ timeout: 5000 })
    await spatialPicker.evaluate((el: any) => {
      const icon = el.querySelector('svg.spatial-picker__input_icon[slot="suffix"]') as HTMLElement | null
      icon?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
    })

    const mapContainer = spatialPicker.locator('.spatial-picker__map-container')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
    await expect(mapContainer.locator('.leaflet-container')).toBeVisible({ timeout: 10000 })

    // Record the current coordinate value so we can detect whether the drag committed.
    const valueBefore = await spatialInput.inputValue()

    // Activate the bbox draw tool. The button is inside terra-map's shadow root,
    // so it must also be clicked via evaluate().
    await spatialPicker.evaluate((el: any) => {
      const terraMap = el.shadowRoot?.querySelector('terra-map') ?? el.querySelector?.('terra-map')
      const btn = terraMap?.shadowRoot?.querySelector('.leaflet-draw-draw-rectangle') as HTMLElement | null
      if (!btn) throw new Error('leaflet-draw-draw-rectangle button not found in shadow DOM')
      btn.click()
    })

    // crosshair confirms Leaflet is in draw mode
    await expect.poll(async () => {
      return spatialPicker.evaluate((el: any) => {
        const terraMap = el.shadowRoot?.querySelector('terra-map') ?? el.querySelector?.('terra-map')
        const mapDiv = terraMap?.shadowRoot?.querySelector('#map') as HTMLElement | null
        return mapDiv ? window.getComputedStyle(mapDiv).cursor : ''
      })
    }, { timeout: 10000, message: 'Draw mode crosshair cursor should appear' })
      .toMatch(/crosshair/)

    // composed: false keeps the events inside the shadow root so Leaflet Draw's
    // document-level mouseup listener never fires — reproducing the real bug
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
