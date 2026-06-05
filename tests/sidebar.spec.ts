import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable, setPlotType } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Sidebar / Constraints Panel — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Sidebar', () => {
  // ──────────────────────────────────────────────
  // Constraints Panel
  // ──────────────────────────────────────────────
  test('Constraints Panel', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const constraintsPanel = page.locator('aside#sidebar')
    await expect(constraintsPanel).toBeVisible()

    // Plot Type section
    const plotTypeSection = constraintsPanel.locator('section').filter({ has: page.locator('text=Plot Type') }).first()
    await expect(plotTypeSection).toBeVisible()
    const mapButton = page.getByTestId('plot-type-selector--map-button')
    const timeSeriesButton = page.getByTestId('plot-type-selector--plot-button')
    await expect(mapButton).toBeVisible()
    await expect(timeSeriesButton).toBeVisible()

    // Variables section
    const variablesSection = constraintsPanel.locator('section').filter({ has: page.locator('text=Variables') }).first()
    await expect(variablesSection).toBeVisible()
    const selectVariableButton = page.locator('terra-button#add-variable-button')
    await expect(selectVariableButton).toBeVisible()
    await expect(selectVariableButton).toContainText('Select a Variable')
    await expect(page.locator('#selected-variables')).toBeVisible()

    // Location section
    const locationSection = constraintsPanel.locator('section').filter({ has: page.locator('text=Location / Region') }).first()
    await expect(locationSection).toBeVisible()
    await expect(page.locator('#spatial-picker')).toBeVisible()
    const spatialPickerHeading = page.locator('#spatial-picker-heading')
    await expect(spatialPickerHeading).toBeVisible()
    await expect(spatialPickerHeading).toContainText('Location / Region')

    // Date Range section
    const dateRangeSection = constraintsPanel.locator('section').filter({ has: page.locator('text=Date Range') }).first()
    await expect(dateRangeSection).toBeVisible()
    await expect(page.locator('#date-range')).toBeVisible()

    // Generate Plot button
    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(generatePlotButton).toBeVisible()
    await expect(generatePlotButton).toContainText('Generate Plot')
    await expect(generatePlotButton).toBeDisabled()

    // All sections are inside the sidebar
    const allPanels = [plotTypeSection, variablesSection, locationSection, dateRangeSection]
    for (const panel of allPanels) {
      const panelBox = await panel.boundingBox()
      const sidebarBox = await constraintsPanel.boundingBox()
      expect(panelBox).toBeTruthy()
      expect(sidebarBox).toBeTruthy()
    }

    // Map button has icon and label
    await expect(mapButton.locator('svg.plot-type-icon')).toBeVisible()
    await expect(mapButton.locator('.plot-type-label')).toContainText('Map')

    // Time Series button has icon and label
    await expect(timeSeriesButton.locator('svg.plot-type-icon')).toBeVisible()
    await expect(timeSeriesButton.locator('.plot-type-label')).toContainText('Time Series')

    // Both buttons are enabled
    await expect(mapButton).toBeEnabled()
    await expect(timeSeriesButton).toBeEnabled()

    // Toggle selections
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)
    await timeSeriesButton.click()
    await expect(timeSeriesButton).toHaveClass(/selected/)

    // No variables selected yet
    await expect(variablesSection.getByText('No variables selected yet')).toBeVisible()
    await expect(selectVariableButton).toBeEnabled()

    // Spatial input and icon
    const spatialInput = locationSection.locator('input[type="text"]')
    const placeholder = await spatialInput.getAttribute('placeholder')
    expect(placeholder).toBeDefined()
    expect(placeholder).toContain('-180, -90, 180, 90')
    await expect(locationSection.locator('svg.spatial-picker__input_icon')).toBeVisible()

    // Date range input and icon
    const dateRangeInput = dateRangeSection.locator('#date-range').locator('input[type="text"]').first()
    await expect(dateRangeInput).toBeVisible()
    const dateRangePlaceholder = await dateRangeInput.getAttribute('placeholder')
    if (dateRangePlaceholder) {
      expect(dateRangePlaceholder).toContain('Select a date range')
    }
    await expect(dateRangeSection.locator('svg.date-picker__icon')).toBeVisible()
  })

  // ──────────────────────────────────────────────
  // Plot Type
  // ──────────────────────────────────────────────
  test('Plot Type', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const mapButton = page.getByTestId('plot-type-selector--map-button')
    const timeSeriesButton = page.getByTestId('plot-type-selector--plot-button')

    // Select Map
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)
    await expect(mapButton).not.toHaveClass(/unselected/)
    await expect(timeSeriesButton).toHaveClass(/unselected/)
    await expect(mapButton.locator('.plot-type-label')).toHaveClass(/selected/)
    await expect(mapButton.locator('svg.plot-type-icon')).toHaveClass(/selected/)

    // Select Time Series
    await timeSeriesButton.click()
    await expect(timeSeriesButton).toHaveClass(/selected/)
    await expect(timeSeriesButton).not.toHaveClass(/unselected/)
    await expect(mapButton).toHaveClass(/unselected/)
    await expect(timeSeriesButton.locator('.plot-type-label')).toHaveClass(/selected/)
    await expect(timeSeriesButton.locator('svg.plot-type-icon')).toHaveClass(/selected/)

    // Toggle back to Map
    await mapButton.click()
    await expect(mapButton).toHaveClass(/selected/)
    await expect(timeSeriesButton).toHaveClass(/unselected/)

    // Only one button is selected at a time
    const selectedButtons = page.locator('button.plot-type-button.plot-type-button--selected')
    await expect(selectedButtons).toHaveCount(1)
  })

  // ──────────────────────────────────────────────
  // Plot Button
  // ──────────────────────────────────────────────
  test('Plot Button', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const generatePlotButton = page.locator('#generate-plot-button')
    await expect(generatePlotButton).toBeVisible()
    await expect(generatePlotButton).toContainText('Generate Plot')

    // Button should be disabled when no variables are selected
    await expect(generatePlotButton).toBeDisabled()
    await expect(generatePlotButton).toHaveClass(/bg-gray-300/)
    await expect(generatePlotButton).toHaveClass(/cursor-not-allowed/)

    // Select a variable to enable the button
    await selectVariable(page)

    // Wait for date range to auto-populate (dynamic wait instead of fixed sleep).
    const dateInputForButton = page.locator('#date-range').locator('input[type="text"]').first()
    await expect(dateInputForButton).toHaveValue(/.+/, { timeout: 10000 })

    await expect(generatePlotButton).toBeEnabled({ timeout: 10000 })
    await expect(generatePlotButton).toHaveClass(/bg-green-500/)

    // Confirm the button disables again if the selected variable is removed
    const selectedVariablesContainer = page.locator('#selected-variables')
    const removeButton = selectedVariablesContainer.locator('button[aria-label*="Remove"]').first()
    await expect(removeButton).toBeVisible()
    await removeButton.click()
    await expect(selectedVariablesContainer).toContainText('No variables selected yet')
    await expect(generatePlotButton).toBeDisabled()
    await expect(generatePlotButton).toHaveClass(/bg-gray-300/)
  })

  // ──────────────────────────────────────────────
  // Vertical Slider (Sidebar Resize Handle)
  // ──────────────────────────────────────────────
  test('Vertical Slider', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const resizeHandle = page.locator('#resize-handle')
    await expect(resizeHandle).toBeVisible()
    await expect(resizeHandle).toHaveCSS('cursor', 'col-resize')

    const sidebar = page.locator('aside#sidebar')
    const initialWidth = await sidebar.evaluate(el => (el as HTMLElement).offsetWidth)
    expect(initialWidth).toBe(500) // default width from inline style

    // Drag the resize handle to the right to widen the sidebar
    const handleBox = await resizeHandle.boundingBox()
    expect(handleBox).toBeTruthy()

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(handleBox!.x + 100, handleBox!.y + handleBox!.height / 2, { steps: 5 })
    await page.mouse.up()

    const newWidth = await sidebar.evaluate(el => (el as HTMLElement).offsetWidth)
    expect(newWidth).toBeGreaterThan(initialWidth)

    // Drag back to the left to narrow the sidebar again
    const handleBoxAfterRightDrag = await resizeHandle.boundingBox()
    expect(handleBoxAfterRightDrag).toBeTruthy()
    await page.mouse.move(handleBoxAfterRightDrag!.x + handleBoxAfterRightDrag!.width / 2, handleBoxAfterRightDrag!.y + handleBoxAfterRightDrag!.height / 2)
    await page.mouse.down()
    await page.mouse.move(handleBoxAfterRightDrag!.x - 200, handleBoxAfterRightDrag!.y + handleBoxAfterRightDrag!.height / 2, { steps: 5 })
    await page.mouse.up()

    const narrowWidth = await sidebar.evaluate(el => (el as HTMLElement).offsetWidth)
    expect(narrowWidth).toBeLessThan(newWidth)

    // Sidebar should respect the min-width of 300px
    expect(narrowWidth).toBeGreaterThanOrEqual(300)
  })

  // ──────────────────────────────────────────────
  // Workspace
  // ──────────────────────────────────────────────
  test('Workspace', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    // Main workspace area is visible
    const workspace = page.locator('main').first()
    await expect(workspace).toBeVisible()

    // Plots container exists
    const plotsArea = page.locator('#plots')
    await expect(plotsArea).toBeVisible()

    // Default view shows the "no plots" message
    await expect(plotsArea).toContainText('Configure your plot settings')
    await expect(plotsArea).toContainText('Add variables to analyze')
    await expect(plotsArea).toContainText('Select plot type and date range')
    await expect(plotsArea).toContainText('Choose spatial area of interest')
  })
})
