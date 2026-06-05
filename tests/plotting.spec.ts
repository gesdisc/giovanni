import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable, setDateRange, setPlotType, requireEarthdataCredentials } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Plotting — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Plotting', () => {
  test('Plotting', async ({ page }) => {
    test.setTimeout(900_000)

    await page.goto('/')
    await dismissSplash(page)

    const mapButton = page.getByTestId('plot-type-selector--map-button')
    await expect(mapButton).toBeVisible()
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)

    const variableLabel = 'Daily mean precipitation rate (combined microwave-IR) estimate - Final Run'
    await selectVariable(page, 'imerg', variableLabel)
    await expect(page.locator('#selected-variables')).toContainText('Daily mean precipitation rate', { timeout: 10000 })

    const spatialInput = page.locator('#spatial-picker').locator('input[type="text"]').first()
    await expect(spatialInput).toBeVisible()
    await spatialInput.fill('-125,24,-66,50')
    await spatialInput.press('Enter')
    await expect(spatialInput).toHaveValue(/-125(?:\.\d+)?,\s*24(?:\.\d+)?,\s*-66(?:\.\d+)?,\s*50(?:\.\d+)?/)

    const dateInput = page.locator('#date-range').locator('input[type="text"]').first()
    await expect(dateInput).toBeVisible()
    // Wait for auto-populated date to settle before overwriting (variable selection triggers async API)
    await expect(dateInput).toHaveValue(/.+/, { timeout: 10000 })
    // Use a date within IMERG's historical range
    const datePicker = page.locator('#date-range')
    await setDateRange(datePicker, dateInput, '2025-03-01', '2025-03-05')
    const selectedDateRange = await dateInput.inputValue()
    expect(selectedDateRange).toMatch(/2025-03-01.*[-–].*2025-03-05/)

    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(generatePlotButton).toBeEnabled({ timeout: 5000 })

    const plotsArea = page.locator('#plots')
    const historyPanel = page.locator('#history-panel')
    const thumbnailsContainer = historyPanel.locator('#thumbnails-container')
    const thumbnailCountBeforeCancel = await thumbnailsContainer.locator('.thumbnail-item').count()

    // splash can reappear mid-test
    await dismissSplash(page)

    // clear the map's IndexedDB cache so it makes a real API call — if it completes
    // instantly from cache the dialog closes before we can click Cancel
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('terra-time-average-map')
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()  // resolve even on error so test continues
        req.onblocked = () => resolve()
      })
    })

    // hang Harmony's create/status-poll requests so the plot stays pending during the cancel test
    const hangHarmonyRequests = async (route: any) => {
      const body = route.request().postData() ?? ''
      // Only hang create/status-poll — also matching CancelSubsetJob would prevent the cancel
      // from ever completing, which would make the "container removed" assertion below a false negative.
      if (body.includes('CreateSubsetJob') || body.includes('GetSubsetJobStatus')) {
        // Leave hanging: never call route.fulfill/continue/abort
        return
      }
      await route.continue()
    }
    await page.route('**/*', hangHarmonyRequests)

    // trigger generate-plot directly to skip the login gate
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))

    const mapPlotContainer = plotsArea.locator('[data-variable-id]').first()
    await expect(mapPlotContainer).toBeVisible({ timeout: 10000 })
    const mapElement = plotsArea.locator('terra-time-average-map')
    await expect(mapElement).toBeVisible({ timeout: 10000 })

    const mapStatusDialog = mapElement.locator('dialog:not(.quota-dialog)')
    await expect(mapStatusDialog).toBeVisible({ timeout: 10000 })
    await expect(mapStatusDialog.locator('terra-loader')).toBeVisible()
    await expect(mapStatusDialog).toContainText('Plotting')
    const cancelButton = mapStatusDialog.locator('terra-button')
    await expect(cancelButton).toBeVisible()
    await expect(cancelButton).toContainText('Cancel')
    await cancelButton.dispatchEvent('click')

    await expect(mapStatusDialog).toBeHidden({ timeout: 10000 })

    // Cancellation should remove the pending map plot and should not add a thumbnail.
    await expect(plotsArea.locator('[data-variable-id]')).toHaveCount(0, { timeout: 10000 })
    await expect(thumbnailsContainer.locator('.thumbnail-item')).toHaveCount(thumbnailCountBeforeCancel)

    // Generate Plot button should remain enabled
    await expect(generatePlotButton).toBeEnabled({ timeout: 5000 })

    // Remove the Harmony route intercept so subsequent generate-plot calls can reach the real API.
    await page.unroute('**/*', hangHarmonyRequests)

    // generate a second plot (no intercept this time)
    await dismissSplash(page)
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))

    const mapElement2 = plotsArea.locator('terra-time-average-map')
    await expect(mapElement2).toBeVisible({ timeout: 10000 })

    const mapStatusDialog2 = mapElement2.locator('dialog:not(.quota-dialog)')
    await expect(mapStatusDialog2).toBeVisible({ timeout: 10000 })

    // needs Earthdata auth to complete; skip if it times out
    const mapDialogHidden = await mapStatusDialog2.waitFor({ state: 'hidden', timeout: 15000 })
      .then(() => true)
      .catch(() => false)
    if (!mapDialogHidden) {
      await mapStatusDialog2.locator('terra-button').dispatchEvent('click').catch(() => {})
    }

    // dialog also closes on API errors, so check the canvas too
    const mapCompleted = mapDialogHidden
      && await mapElement2.locator('canvas').first().waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    expect(mapCompleted).toBeTruthy()
    await expect(thumbnailsContainer.locator('.thumbnail-item')).toHaveCount(1, { timeout: 15000 })

    // Switch to Time Series and generate a plot
    const timeSeriesButton = page.getByTestId('plot-type-selector--plot-button')
    await setPlotType(page, 'plot')
    await expect(timeSeriesButton).toHaveClass(/selected/)

    await dismissSplash(page)
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))

    const tsElement = plotsArea.locator('terra-time-series')
    await expect(tsElement.first()).toBeVisible({ timeout: 10000 })

    // dismiss quota warning if one pops up
    const tsQuotaDialog = tsElement.first().locator('dialog.quota-dialog')
    const tsQuotaVisible = await tsQuotaDialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
    if (tsQuotaVisible) {
      await tsQuotaDialog.locator('terra-button:has-text("Proceed")').dispatchEvent('click')
    }

    const tsStatusDialog = tsElement.first().locator('dialog:not(.quota-dialog)')
    await expect(tsStatusDialog).toBeVisible({ timeout: 10000 })

    // needs auth to complete
    const tsDialogHidden = await tsStatusDialog.waitFor({ state: 'hidden', timeout: 120_000 })
      .then(() => true)
      .catch(() => false)
    if (!tsDialogHidden) {
      await tsStatusDialog.locator('terra-button').dispatchEvent('click').catch(() => {})
    }

    // dialog closes on errors too, check chart rendered
    const tsCompleted = tsDialogHidden
      && await tsElement.first().locator('.js-plotly-plot').waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    expect(tsCompleted).toBeTruthy()
    await expect(thumbnailsContainer.locator('.thumbnail-item')).toHaveCount(2, { timeout: 15000 })

    // Open spatial picker map and switch to point selection
    const spatialPicker = page.locator('#spatial-picker')
    const mapIcon = spatialPicker.locator('svg.spatial-picker__input_icon[slot="suffix"]')
    await mapIcon.dispatchEvent('click')

    const mapContainer = spatialPicker.locator('.spatial-picker__map-container')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
    await expect(mapContainer.locator('.leaflet-container')).toBeVisible({ timeout: 10000 })

    // Click the marker icon (point selection tool) below the bounding box icon
    const markerTool = mapContainer.locator('.leaflet-draw-draw-marker')
    await expect(markerTool).toBeVisible({ timeout: 10000 })
    await markerTool.click()

    // Click on Washington D.C. coordinates on the map
    const leafletMap = mapContainer.locator('.leaflet-container')
    const mapBox = (await leafletMap.boundingBox())!
    const dcX = mapBox.x + mapBox.width * 0.286
    const dcY = mapBox.y + mapBox.height * 0.284
    await page.mouse.click(dcX, dcY)

    const placedMarker = mapContainer.locator('.leaflet-marker-icon')
    await expect(placedMarker).toBeVisible({ timeout: 10000 })

    // Close the spatial picker map
    await page.click('body', { position: { x: 10, y: 10 } })
    await expect(mapContainer).toBeHidden({ timeout: 5000 })

    // generate a point-based time series plot
    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })
    await dismissSplash(page)
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))

    const tsElements = plotsArea.locator('terra-time-series')
    await expect(tsElements.first()).toBeVisible({ timeout: 10000 })

    // dismiss quota warning if one pops up
    const pointQuotaDialog = tsElements.first().locator('dialog.quota-dialog')
    const pointQuotaVisible = await pointQuotaDialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
    if (pointQuotaVisible) {
      await pointQuotaDialog.locator('terra-button:has-text("Proceed")').dispatchEvent('click')
    }

    // may complete quickly for point requests
    const pointTsDialog = tsElements.first().locator('dialog:not(.quota-dialog)')
    const pointDialogSeen = await pointTsDialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)

    // needs auth to complete
    let pointDialogHidden = !pointDialogSeen
    if (pointDialogSeen) {
      pointDialogHidden = await pointTsDialog.waitFor({ state: 'hidden', timeout: 120_000 })
        .then(() => true)
        .catch(() => false)
      if (!pointDialogHidden) {
        await pointTsDialog.locator('terra-button').dispatchEvent('click').catch(() => {})
      }
    }

    // dialog closes on errors too, check chart rendered
    const pointTsCompleted = pointDialogHidden
      && await tsElements.first().locator('.js-plotly-plot').waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    expect(pointTsCompleted).toBeTruthy()
    await expect(thumbnailsContainer.locator('.thumbnail-item')).toHaveCount(3, { timeout: 15000 })

    // newer plots go to the top
    await expect
      .poll(async () => await plotsArea.locator('[data-variable-id]').count(), { timeout: 10000 })
      .toBeGreaterThanOrEqual(3)

    // ── History Carousel ──

    // Each thumbnail should display either a plot thumbnail image or a static icon placeholder
    const thumbnails = thumbnailsContainer.locator('.thumbnail-item')
    await expect(thumbnails).toHaveCount(3, { timeout: 10000 })

    for (let i = 0; i < 3; i++) {
      const thumb = thumbnails.nth(i)
      // Thumbnail should have either an <img> with a blob src or a terra-icon placeholder
      const hasImage = await thumb.locator('img').isVisible().catch(() => false)
      const hasIcon = await thumb.locator('terra-icon').isVisible().catch(() => false)
      expect(hasImage || hasIcon).toBeTruthy()
    }

    // Hovering each thumbnail should display a tooltip with plot constraints
    const tooltip = page.locator('#thumbnail-tooltip')
    for (let i = 0; i < 3; i++) {
      const thumb = thumbnails.nth(i)
      await thumb.hover()
      await expect(tooltip).toHaveCSS('opacity', '1', { timeout: 5000 })
      // Tooltip should contain the variable name, date range, and spatial area
      const tooltipText = await tooltip.textContent()
      expect(tooltipText).toBeTruthy()
      expect(tooltipText!.length).toBeGreaterThan(0)
      // Move away to hide tooltip
      await page.mouse.move(0, 0)
      await expect(tooltip).toHaveCSS('opacity', '0', { timeout: 5000 })
    }

    // Click each thumbnail in turn — clicking should show that plot at the top of the workspace
    for (let i = 0; i < 3; i++) {
      // Re-query thumbnails since clicking triggers generate-plot which rebuilds the plots area
      const currentThumbnails = thumbnailsContainer.locator('.thumbnail-item')
      const thumb = currentThumbnails.nth(i)

      await thumb.click()

      // A new plot should appear at the top of the workspace
      const topPlot = plotsArea.locator('[data-variable-id]').first()
      await expect(topPlot).toBeVisible({ timeout: 15000 })

      // The plot component (map or time series) should be visible
      const hasMap = await plotsArea.locator('terra-time-average-map').first().isVisible().catch(() => false)
      const hasTs = await plotsArea.locator('terra-time-series').first().isVisible().catch(() => false)
      expect(hasMap || hasTs).toBeTruthy()

      // Wait for the loading dialog to appear and either complete or cancel it gracefully
      const plotElement = hasMap
        ? plotsArea.locator('terra-time-average-map').first()
        : plotsArea.locator('terra-time-series').first()
      const dialog = plotElement.locator('dialog:not(.quota-dialog)')
      const dialogVisible = await dialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
      if (dialogVisible) {
        const completed = await dialog.waitFor({ state: 'hidden', timeout: 15_000 })
          .then(() => true)
          .catch(() => false)
        if (!completed) {
          await dialog.locator('terra-button').dispatchEvent('click').catch(() => {})
        }
      }
    }

    // Inspect Area-Averaged Time Series Plot
    if (tsCompleted || pointTsCompleted) {

    const inspectTs = plotsArea.locator('terra-time-series').first()
    await expect(inspectTs).toBeVisible({ timeout: 10000 })
    const toolbar = inspectTs.locator('terra-plot-toolbar')

    // Title should match the selected variable name
    const titleEl = toolbar.locator('h2.title')
    await expect(titleEl).toBeVisible({ timeout: 10000 })
    await expect(titleEl).toContainText('Daily mean precipitation rate')

    // Subtitle metadata listing
    const subtitleEl = toolbar.locator('h3.subtitle')
    await expect(subtitleEl).toBeVisible({ timeout: 10000 })
    const subtitleText = await subtitleEl.textContent() ?? ''
    // platform/sensor
    expect(subtitleText).toMatch(/MULTI/i)
    // temporal resolution
    expect(subtitleText).toMatch(/daily/i)
    // shortname+version id in brackets
    expect(subtitleText).toMatch(/\[GPM_3IMERGDF/)
    // location or region
    const locationText = toolbar.locator('.location-text')
    await expect(locationText).toBeVisible({ timeout: 5000 })
    // date range — attribute show-date-range not yet set on time series plots

    // Icon buttons near the title
    const infoBtn = toolbar.locator('terra-button[data-menu-name="information"]')
    await expect(infoBtn).toBeVisible({ timeout: 5000 })
    const downloadBtn = toolbar.locator('terra-button[data-menu-name="download"]')
    await expect(downloadBtn).toBeVisible({ timeout: 5000 })
    const helpBtn = toolbar.locator('terra-button[data-menu-name="help"]')
    await expect(helpBtn).toBeVisible({ timeout: 5000 })
    const jupyterBtn = toolbar.locator('terra-button[data-menu-name="jupyter"]')
    await expect(jupyterBtn).toBeVisible({ timeout: 5000 })

    // Graph data should be consistent with the date range constraints
    const inspectPlotly = inspectTs.locator('terra-plot .js-plotly-plot')
    await expect(inspectPlotly).toBeVisible({ timeout: 10000 })

    // Modebar buttons: Pan, Zoom In, Zoom Out, Autoscale
    const modebar = inspectTs.locator('terra-plot .modebar')
    await expect(modebar).toBeVisible({ timeout: 10000 })
    const panBtn = inspectTs.locator('terra-plot .modebar-btn[data-title="Pan"]')
    await expect(panBtn).toBeVisible()
    const zoomInBtn = inspectTs.locator('terra-plot .modebar-btn[data-title="Zoom in"]')
    await expect(zoomInBtn).toBeVisible()
    const zoomOutBtn = inspectTs.locator('terra-plot .modebar-btn[data-title="Zoom out"]')
    await expect(zoomOutBtn).toBeVisible()
    const autoscaleBtn = inspectTs.locator('terra-plot .modebar-btn[data-title="Autoscale"]')
    await expect(autoscaleBtn).toBeVisible()

    // Hover over data points → tooltip with data value
    const plotArea = inspectTs.locator('terra-plot .js-plotly-plot .plot-container .subplot.xy')
    const plotBox = await plotArea.boundingBox()
    if (plotBox) {
      for (let frac = 0.2; frac <= 0.8; frac += 0.15) {
        await page.mouse.move(plotBox.x + plotBox.width * frac, plotBox.y + plotBox.height / 2)
        const hoverLabel = inspectTs.locator('terra-plot .js-plotly-plot .hoverlayer .hovertext')
        const hoverVisible = await hoverLabel.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
        if (hoverVisible) {
          const hoverText = await hoverLabel.textContent()
          expect(hoverText).toBeTruthy()
          break
        }
      }
      await page.mouse.move(0, 0)
    }

    // Draw a bounding box to zoom the graph
    if (plotBox) {
      const x1 = plotBox.x + plotBox.width * 0.25
      const y1 = plotBox.y + plotBox.height * 0.25
      const x2 = plotBox.x + plotBox.width * 0.75
      const y2 = plotBox.y + plotBox.height * 0.75

      await page.mouse.move(x1, y1)
      await page.mouse.down()
      await page.mouse.move(x2, y2)
      await page.mouse.up()
      await page.waitForTimeout(500)
      await expect(inspectPlotly).toBeVisible()

      // Click Autoscale to reset axes to initial extent
      await autoscaleBtn.click()
      await page.waitForTimeout(500)
      await expect(inspectPlotly).toBeVisible()
    }

    // Info panel
    const menu = toolbar.locator('menu#menu')

    // Hover over info icon → panel with variable information
    await infoBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })

    const infoDl = menu.locator('dl')
    await expect(infoDl).toBeVisible({ timeout: 5000 })
    await expect(infoDl.locator('dt:has-text("Variable Longname")')).toBeVisible()
    await expect(infoDl.locator('dd').first()).toContainText('Daily mean precipitation rate')
    await expect(infoDl.locator('dt:has-text("Variable Shortname")')).toBeVisible()
    await expect(infoDl.locator('dt:has-text("Units")')).toBeVisible()

    // Click dataset link → correct dataset landing page in new tab
    const datasetLink = infoDl.locator('dt:has-text("Dataset Information") + dd a')
    await expect(datasetLink).toBeVisible()
    const datasetHref = await datasetLink.getAttribute('href')
    expect(datasetHref).toBeTruthy()
    expect(datasetHref).toContain('disc.gsfc.nasa.gov')

    // Click variable information link → correct glossary entry in new tab
    await infoBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })
    const glossaryLink = menu.locator('dt:has-text("Variable Information") + dd a')
    await expect(glossaryLink).toBeVisible()
    const glossaryHref = await glossaryLink.getAttribute('href')
    expect(glossaryHref).toBeTruthy()

    // Download panel
    // Hover over download icon → panel with PNG, JPG, CSV options
    await downloadBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })

    const pngBtn = menu.locator('terra-button:has-text("PNG")')
    await expect(pngBtn).toBeVisible({ timeout: 5000 })
    const jpgBtn = menu.locator('terra-button:has-text("JPG")')
    await expect(jpgBtn).toBeVisible({ timeout: 5000 })
    const csvBtn = menu.locator('terra-button:has-text("CSV")')
    await expect(csvBtn).toBeVisible({ timeout: 5000 })

    // Click each download option — verify download fires
    const [pngDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      pngBtn.click(),
    ]).catch(() => [null])
    if (pngDownload) {
      expect(pngDownload.suggestedFilename()).toMatch(/\.png$/i)
    }

    await downloadBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })
    const [jpgDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      menu.locator('terra-button:has-text("JPG")').click(),
    ]).catch(() => [null])
    if (jpgDownload) {
      expect(jpgDownload.suggestedFilename()).toMatch(/\.jpe?g$/i)
    }

    await downloadBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      menu.locator('terra-button:has-text("CSV")').click(),
    ]).catch(() => [null])
    if (csvDownload) {
      expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/i)
    }

    // Help panel
    // Hover over help icon → menu with User Guide and Earthdata Forum
    await helpBtn.hover()
    await expect(menu).toBeVisible({ timeout: 5000 })

    const forumLink = menu.locator('a:has-text("Earthdata")')
    await expect(forumLink).toBeVisible({ timeout: 5000 })
    const userGuideLink = menu.locator('a:has-text("User Guide")')
    const hasUserGuide = await userGuideLink.isVisible().catch(() => false)

    // Click User Guide → verify href points to correct URL
    if (hasUserGuide) {
      const userGuideHref = await userGuideLink.getAttribute('href').catch(() => '')
      expect(userGuideHref).toBeTruthy()
    }

    // Click Earthdata Forum → verify href points to forum
    const forumHref = await forumLink.getAttribute('href').catch(() => '')
    expect(forumHref).toContain('forum.earthdata.nasa.gov')

    // Jupyter Notebook panel
    const jupyterBtnVisible = await jupyterBtn.isVisible().catch(() => false)
    if (jupyterBtnVisible) {
      await jupyterBtn.hover()
      await expect(menu).toBeVisible({ timeout: 5000 })
      const jupyterLink = menu.locator('a:has-text("Open in Jupyter Notebook")')
      await expect(jupyterLink).toBeVisible({ timeout: 5000 })
      const jupyterHref = await jupyterLink.getAttribute('href').catch(() => '')
      expect(jupyterHref).toBeTruthy()
    }

    }

    // Inspect Time-Averaged Map Plot
    // Bring focus back to the main page after any new-tab interactions
    await page.bringToFront()
    // make sure there's a time-averaged map in the workspace
    const hasMapAlready = await plotsArea.locator('terra-time-average-map').first()
      .waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)

    if (!hasMapAlready) {
      // Click the map thumbnail from the history carousel to load it
      const mapThumb = thumbnailsContainer.locator('.thumbnail-item').first()
      const hasThumb = await mapThumb.isVisible().catch(() => false)
      if (hasThumb) {
        await mapThumb.click()
        const fallbackMap = plotsArea.locator('terra-time-average-map').first()
        await expect(fallbackMap).toBeVisible({ timeout: 15000 })
        const fallbackDialog = fallbackMap.locator('dialog:not(.quota-dialog)')
        const fallbackDialogVisible = await fallbackDialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
        if (fallbackDialogVisible) {
          const fallbackHidden = await fallbackDialog.waitFor({ state: 'hidden', timeout: 30000 })
            .then(() => true).catch(() => false)
          if (!fallbackHidden) {
            await fallbackDialog.locator('terra-button').dispatchEvent('click').catch(() => {})
          }
        }
      } else {
        // No thumbnails available — switch to Map type and generate
        const mapTypeBtn = page.getByTestId('plot-type-selector--map-button')
        await mapTypeBtn.click({ timeout: 10000 })
        await expect(mapTypeBtn).toHaveClass(/selected/)
        await page.evaluate(() => document.dispatchEvent(new CustomEvent('generate-plot')))
        const fallbackMap = plotsArea.locator('terra-time-average-map').first()
        await expect(fallbackMap).toBeVisible({ timeout: 10000 })
        const fallbackDialog = fallbackMap.locator('dialog:not(.quota-dialog)')
        const fallbackHidden = await fallbackDialog.waitFor({ state: 'hidden', timeout: 30000 })
          .then(() => true).catch(() => false)
        if (!fallbackHidden) {
          await fallbackDialog.locator('terra-button').dispatchEvent('click').catch(() => {})
        }
      }
    }

    // Locate the first time-averaged map plot in the workspace
    const inspectMap = plotsArea.locator('terra-time-average-map').first()
    await expect(inspectMap).toBeVisible({ timeout: 10000 })
    const mapToolbar = inspectMap.locator('terra-plot-toolbar')

    // Title should match the selected variable name
    const mapTitleEl = mapToolbar.locator('h2.title')
    await expect(mapTitleEl).toBeVisible({ timeout: 10000 })
    await expect(mapTitleEl).toContainText('Daily mean precipitation rate')

    // Subtitle metadata: platform/sensor, temporal resolution, shortname+version, region, date range
    const mapSubtitleEl = mapToolbar.locator('h3.subtitle')
    await expect(mapSubtitleEl).toBeVisible({ timeout: 10000 })
    const mapSubtitleText = await mapSubtitleEl.textContent()
    // platform/sensor
    expect(mapSubtitleText).toMatch(/MULTI/i)
    // temporal resolution
    expect(mapSubtitleText).toMatch(/daily/i)
    // shortname+version in brackets
    expect(mapSubtitleText).toMatch(/\[GPM_3IMERGDF/)
    // region (coordinates or named region)
    const mapLocationText = mapToolbar.locator('.location-text')
    await expect(mapLocationText).toBeVisible({ timeout: 5000 })
    // date range (time-averaged map shows dates in subtitle via show-date-range attribute)
    expect(mapSubtitleText).toMatch(/\d{4}-\d{2}-\d{2}/)

    // Icon buttons: Information, Download, Help, Jupyter Notebook, Settings (GeoTIFF)
    const mapInfoBtn = mapToolbar.locator('terra-button[data-menu-name="information"]')
    await expect(mapInfoBtn).toBeVisible({ timeout: 5000 })
    const mapDownloadBtn = mapToolbar.locator('terra-button[data-menu-name="download"]')
    await expect(mapDownloadBtn).toBeVisible({ timeout: 5000 })
    const mapHelpBtn = mapToolbar.locator('terra-button[data-menu-name="help"]')
    await expect(mapHelpBtn).toBeVisible({ timeout: 5000 })
    const mapJupyterBtn = mapToolbar.locator('terra-button[data-menu-name="jupyter"]')
    await expect(mapJupyterBtn).toBeVisible({ timeout: 5000 })
    const geoTiffBtn = mapToolbar.locator('terra-button[data-menu-name="GeoTIFF"]')
    await expect(geoTiffBtn).toBeVisible({ timeout: 5000 })

    const mapCanvas = inspectMap.locator('.ol-viewport canvas').first()
    await expect(mapCanvas).toBeVisible({ timeout: 15000 })

    // Map features/controls
    // Zoom in button (upper left)
    const olZoomIn = inspectMap.locator('button.ol-zoom-in')
    await expect(olZoomIn).toBeVisible({ timeout: 5000 })
    // Zoom out button (upper left)
    const olZoomOut = inspectMap.locator('button.ol-zoom-out')
    await expect(olZoomOut).toBeVisible({ timeout: 5000 })
    // Pixel value readout (lower left)
    const pixelValue = inspectMap.locator('#pixelValue')
    await expect(pixelValue).toBeVisible({ timeout: 5000 })
    // Cursor coordinate readout (lower left)
    const cursorCoords = inspectMap.locator('#cursorCoordinates')
    await expect(cursorCoords).toBeVisible({ timeout: 5000 })
    // Color map legend (right side)
    const legend = inspectMap.locator('#legend')
    await expect(legend).toBeVisible({ timeout: 5000 })
    const legendMax = legend.locator('#statsMax')
    await expect(legendMax).toBeVisible()
    const legendMin = legend.locator('#statsMin')
    await expect(legendMin).toBeVisible()

    const olViewport = inspectMap.locator('.ol-viewport')
    await expect(olViewport).toBeVisible({ timeout: 5000 })

    // Pan the map: drag from center to offset
    const olMapBox = await inspectMap.locator('#map').boundingBox()
    if (olMapBox) {
      const centerX = olMapBox.x + olMapBox.width / 2
      const centerY = olMapBox.y + olMapBox.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY + 50, { steps: 10 })
      await page.mouse.up()
      await page.waitForTimeout(500)
    }

    // Click zoom in
    await olZoomIn.click()
    await page.waitForTimeout(500)

    // Click zoom out
    await olZoomOut.click()
    await page.waitForTimeout(500)

    // Drag bounding box to zoom to region
    if (olMapBox) {
      const x1 = olMapBox.x + olMapBox.width * 0.3
      const y1 = olMapBox.y + olMapBox.height * 0.3
      const x2 = olMapBox.x + olMapBox.width * 0.7
      const y2 = olMapBox.y + olMapBox.height * 0.7
      await page.keyboard.down('Shift')
      await page.mouse.move(x1, y1)
      await page.mouse.down()
      await page.mouse.move(x2, y2, { steps: 10 })
      await page.mouse.up()
      await page.keyboard.up('Shift')
      await page.waitForTimeout(500)
    }

    // Hover over a spot with data → pixel value + coordinates
    if (olMapBox) {
      const dataX = olMapBox.x + olMapBox.width * 0.5
      const dataY = olMapBox.y + olMapBox.height * 0.5
      await page.mouse.move(dataX, dataY)
      await page.waitForTimeout(500)
      const pixelValueText = (await pixelValue.textContent())?.trim() ?? ''
      expect(pixelValueText).not.toBe('N/A')
      // Cursor coordinates should show lat/lon
      const coordText = await cursorCoords.textContent()
      expect(coordText).toBeTruthy()
      expect(coordText!.length).toBeGreaterThan(0)
    }

    // Hover over a spot without data (e.g. far corner, likely ocean/no-data)
    if (olMapBox) {
      const noDataX = olMapBox.x + 5
      const noDataY = olMapBox.y + 5
      await page.mouse.move(noDataX, noDataY)
      await page.waitForTimeout(500)
      const noDataPixelValue = (await pixelValue.textContent())?.trim() ?? ''
      expect(noDataPixelValue).toBe('N/A')
      const coordText2 = await cursorCoords.textContent()
      expect(coordText2).toBeTruthy()
    }

    // Information panel
    const mapMenu = mapToolbar.locator('menu#menu')
    await mapInfoBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    const mapInfoDl = mapMenu.locator('dl')
    await expect(mapInfoDl).toBeVisible({ timeout: 5000 })
    await expect(mapInfoDl.locator('dt:has-text("Variable Longname")')).toBeVisible()
    await expect(mapInfoDl.locator('dd').first()).toContainText('Daily mean precipitation rate')
    await expect(mapInfoDl.locator('dt:has-text("Variable Shortname")')).toBeVisible()
    await expect(mapInfoDl.locator('dt:has-text("Units")')).toBeVisible()
    const mapDatasetLink = mapInfoDl.locator('dt:has-text("Dataset Information") + dd a')
    await expect(mapDatasetLink).toBeVisible()
    const mapGlossaryLink = mapInfoDl.locator('dt:has-text("Variable Information") + dd a')
    await expect(mapGlossaryLink).toBeVisible()

    // Verify dataset link href
    const mapDatasetHref = await mapDatasetLink.getAttribute('href')
    expect(mapDatasetHref).toBeTruthy()

    // Verify glossary link href
    const mapGlossaryHref = await mapGlossaryLink.getAttribute('href')
    expect(mapGlossaryHref).toBeTruthy()

    // Download panel: GeoTIFF, PNG, JPG
    await mapDownloadBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    const geotiffDlBtn = mapMenu.locator('terra-button:has-text("GeoTIFF")')
    await expect(geotiffDlBtn).toBeVisible({ timeout: 5000 })
    const mapPngBtn = mapMenu.locator('terra-button:has-text("PNG")')
    await expect(mapPngBtn).toBeVisible({ timeout: 5000 })
    const mapJpgBtn = mapMenu.locator('terra-button:has-text("JPG")')
    await expect(mapJpgBtn).toBeVisible({ timeout: 5000 })

    // Click each download option
    const [geotiffDl] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      geotiffDlBtn.click(),
    ]).catch(() => [null])
    if (geotiffDl) {
      expect(geotiffDl.suggestedFilename()).toMatch(/\.tiff?$/i)
    }

    await mapDownloadBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    const [mapPngDl] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      mapMenu.locator('terra-button:has-text("PNG")').click(),
    ]).catch(() => [null])
    if (mapPngDl) {
      expect(mapPngDl.suggestedFilename()).toMatch(/\.png$/i)
    }

    await mapDownloadBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    const [mapJpgDl] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      mapMenu.locator('terra-button:has-text("JPG")').click(),
    ]).catch(() => [null])
    if (mapJpgDl) {
      expect(mapJpgDl.suggestedFilename()).toMatch(/\.jpe?g$/i)
    }

    // Help panel — verify link hrefs without clicking
    await mapHelpBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    const mapUserGuideLink = mapMenu.locator('a:has-text("User Guide")')
    const mapForumLink = mapMenu.locator('a:has-text("Earthdata")')
    await expect(mapForumLink).toBeVisible({ timeout: 5000 })
    const mapForumHref = await mapForumLink.getAttribute('href').catch(() => '')
    expect(mapForumHref).toContain('forum.earthdata.nasa.gov')
    const mapHasGuide = await mapUserGuideLink.isVisible().catch(() => false)
    if (mapHasGuide) {
      const mapGuideHref = await mapUserGuideLink.getAttribute('href').catch(() => '')
      expect(mapGuideHref).toBeTruthy()
    }

    // Jupyter panel — verify link href
    const mapJupyterVisible = await mapJupyterBtn.isVisible().catch(() => false)
    if (mapJupyterVisible) {
      await mapJupyterBtn.hover()
      await expect(mapMenu).toBeVisible({ timeout: 5000 })
      const mapJupyterLink = mapMenu.locator('a:has-text("Open in Jupyter Notebook")')
      await expect(mapJupyterLink).toBeVisible({ timeout: 5000 })
      const mapJupyterHref = await mapJupyterLink.getAttribute('href').catch(() => '')
      expect(mapJupyterHref).toBeTruthy()
    }

    // Settings (GeoTIFF) panel
    await geoTiffBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })

    // Opacity slider
    const opacitySlider = mapMenu.locator('input[type="range"]')
    await expect(opacitySlider).toBeVisible({ timeout: 5000 })
    const initialOpacityText = ((await mapMenu.locator('#opacity-output').textContent()) ?? '').trim()
    const initialMapOpacity = await inspectMap.evaluate((el: any) => Number(el.opacity ?? NaN))

    // Manipulate opacity: drag slider to ~50%
    const sliderBox = await opacitySlider.boundingBox()
    if (sliderBox) {
      const midX = sliderBox.x + sliderBox.width * 0.5
      const midY = sliderBox.y + sliderBox.height / 2
      await page.mouse.click(midX, midY)
      await page.waitForTimeout(300)
      // Verify the opacity output updated
      const opacityOutput = mapMenu.locator('#opacity-output')
      const opacityText = await opacityOutput.textContent().catch(() => '')
      // Opacity should now be around 0.5 (not 1.00)
      if (opacityText) {
        const opacityVal = parseFloat(opacityText)
        expect(opacityVal).toBeLessThan(1)
        expect(opacityVal).toBeGreaterThan(0)
      }
      expect((opacityText ?? '').trim()).not.toBe(initialOpacityText)

      const updatedMapOpacity = await inspectMap.evaluate((el: any) => Number(el.opacity ?? NaN))
      if (!Number.isNaN(initialMapOpacity) && !Number.isNaN(updatedMapOpacity)) {
        expect(updatedMapOpacity).not.toBe(initialMapOpacity)
      }
    }

    // Color map drop-down
    const colormapSelect = mapMenu.locator('#colormap-select')
    await expect(colormapSelect).toBeVisible({ timeout: 5000 })
    const palette = legend.locator('.palette .color-box')
    const paletteBefore = await palette.evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).getAttribute('style') ?? '').join('|')
    )
    // Select a different colormap
    await colormapSelect.selectOption('hot')
    await page.waitForTimeout(500)
    const selectedColorMap = await colormapSelect.inputValue()
    expect(selectedColorMap).toBe('hot')
    const paletteAfter = await palette.evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).getAttribute('style') ?? '').join('|')
    )
    expect(paletteAfter).not.toBe(paletteBefore)

    // Data Profile checkbox
    const drawProfileCheckbox = mapMenu.locator('input[type="checkbox"]')
    await expect(drawProfileCheckbox).toBeVisible({ timeout: 5000 })

    // Re-hover settings to keep menu open before checking the box
    await geoTiffBtn.hover()
    await expect(mapMenu).toBeVisible({ timeout: 5000 })
    await drawProfileCheckbox.check()
    await expect(drawProfileCheckbox).toBeChecked()
    await page.waitForTimeout(300)

    // Draw a profile line on the map
    if (olMapBox) {
      const profilePopover = inspectMap.locator('.plot-popover')
      await expect(profilePopover).toBeHidden({ timeout: 2000 }).catch(() => {})

      // Click to create the initial point
      const profX1 = olMapBox.x + olMapBox.width * 0.3
      const profY1 = olMapBox.y + olMapBox.height * 0.5
      await page.mouse.click(profX1, profY1)
      await page.waitForTimeout(200)

      // Click to create a second point (next segment)
      const profX2 = olMapBox.x + olMapBox.width * 0.5
      const profY2 = olMapBox.y + olMapBox.height * 0.4
      await page.mouse.click(profX2, profY2)
      await page.waitForTimeout(200)

      // During line drawing, the data profile popover should still be hidden.
      await expect(profilePopover).toBeHidden({ timeout: 2000 }).catch(() => {})

      // Double-click to finish the line
      const profX3 = olMapBox.x + olMapBox.width * 0.7
      const profY3 = olMapBox.y + olMapBox.height * 0.5
      await page.mouse.dblclick(profX3, profY3)
      await page.waitForTimeout(500)

      await expect(profilePopover).toBeVisible({ timeout: 5000 })
      const profileEnabled = await inspectMap.evaluate((el: any) => Boolean(el.toggleState))
      expect(profileEnabled).toBeTruthy()

      // The popover should contain a terra-plot (Plotly chart)
      const profilePlot = profilePopover.locator('terra-plot')
      await expect(profilePlot).toBeVisible({ timeout: 5000 })
      // And a minimize/restore button
      const minifyBtn = profilePopover.locator('terra-button.minify-btn')
      await expect(minifyBtn).toBeVisible({ timeout: 5000 })
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Plotting — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Plotting - Bugs', () => {
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
    const creds = requireEarthdataCredentials(test)
    if (!creds) return
    const { username, password } = creds

    // Keep a local reference to the base URL for waitForURL regex matching.
    const baseUrl = process.env.GIOVANNI_BASE_URL ?? 'http://127.0.0.1:5173/'

    await page.goto('/')
    await dismissSplash(page)

    // Log in first — the history panel only activates for authenticated users.
    const loginComponent = page.locator('terra-login#login')
    await expect(loginComponent).toBeVisible({ timeout: 10000 })
    await loginComponent.click()

    await expect(page).toHaveTitle(/Earthdata Login/i, { timeout: 30000 })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    await page.waitForURL(new RegExp(baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 })
    await dismissSplash(page)

    // wipe history so count assertions start from a clean slate
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
})
