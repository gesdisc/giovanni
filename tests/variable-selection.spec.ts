import { test, expect } from '@playwright/test'
import { dismissSplash, selectVariable } from './helpers'

// ──────────────────────────────────────────────────────────────────────────────
// Variable Selection — Regression
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Variable Selection', () => {
  test('Variable Selection', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    const selectVariableButton = page.locator('terra-button#add-variable-button')
    await selectVariableButton.click()

    const dialog = page.locator('terra-dialog#add-variable-dialog')
    await expect(dialog).toBeVisible()

    const browseVariables = page.locator('terra-browse-variables#variable-selector')
    await expect(browseVariables).toBeVisible()

    // Search input
    const searchInput = page.getByRole('combobox')
    await expect(searchInput).toBeVisible()
    const searchPlaceholder = await searchInput.getAttribute('placeholder')
    if (searchPlaceholder) {
      expect(searchPlaceholder).toMatch(/enter search terms/i)
    }

    // Browse categories
    await expect(browseVariables.getByText(/observations/i)).toBeVisible({ timeout: 5000 })
    await expect(browseVariables.getByText(/research areas?/i)).toBeVisible({ timeout: 5000 })
    await expect(browseVariables.getByText(/measurements/i)).toBeVisible({ timeout: 5000 })
    await expect(browseVariables.getByText(/sources/i)).toBeVisible({ timeout: 5000 })

    // Observations heading
    const observationsHeading = browseVariables.locator('h3:has-text("Observations")').first()
    await expect(observationsHeading).toBeVisible({ timeout: 5000 })
    const observationsSection = observationsHeading.locator('xpath=ancestor::aside').first()
    await expect(observationsSection).toBeVisible()

    // Radio buttons (these are native inputs that may be visually hidden by custom styling)
    const allOption = browseVariables.locator('input[type="radio"][value="All"]')
    const modelOption = browseVariables.locator('input[type="radio"][value="Model"]')
    const observationOption = browseVariables.locator('input[type="radio"][value="Observation"]')
    const reanalysisOption = browseVariables.locator('input[type="radio"][value="Reanalysis"]')
    await expect(allOption).toBeAttached({ timeout: 15000 })
    await expect(modelOption).toBeAttached()
    await expect(observationOption).toBeAttached()
    await expect(reanalysisOption).toBeAttached()
    await expect(allOption).toBeChecked()

    // View All button
    const viewAllButton = browseVariables.getByRole('button', { name: /view all now/i }).first()
    await expect(viewAllButton).toBeVisible({ timeout: 5000 })

    // Search for a variable
    await searchInput.fill('imerg')
    await expect(searchInput).toHaveValue('imerg')
    await searchInput.press('Enter')

    await page.locator('terra-variable-keyword-search').evaluate((el: any) => el.close?.())
    await expect(page.getByRole('listbox', { name: /Keywords Matching/i })).toBeHidden()
    await expect(dialog).toBeVisible()

    const variableList = browseVariables.locator('ul.variable-list')
    await expect(variableList).toBeVisible()
    await expect(variableList).toContainText(/imerg/i)

    const variableItems = browseVariables.locator('li.variable-list-item')
    await expect(variableItems.first()).toBeVisible()

    // Select first variable
    const removedVariableText = (await variableItems.first().innerText()).trim()
    await variableItems.first().locator('label').click({ force: true })

    const selectedVariablesContainer = page.locator('#selected-variables')
    await expect(selectedVariablesContainer).not.toContainText('No variables selected yet')

    // Remove variable
    const removeButton = selectedVariablesContainer.locator('button[aria-label*="Remove"]').first()
    await expect(removeButton).toBeVisible()
    await removeButton.click()
    await expect(selectedVariablesContainer).toContainText('No variables selected yet')

    // Re-open and select a different variable
    await selectVariableButton.click()
    await expect(dialog).toBeVisible()
    await expect(browseVariables).toBeVisible()

    const reopenedVariableItems = browseVariables.locator('li.variable-list-item')
    await expect(reopenedVariableItems.first()).toBeVisible()
    await reopenedVariableItems.nth(1).locator('label').click({ force: true })

    // The variable removed in step #5 should not remain selected.
    await expect(selectedVariablesContainer).not.toContainText(removedVariableText)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Variable Selection — Bugs
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Variable Selection - Bugs', () => {
  // Bug 2 — Variable picker returns no results for plural search terms.
  //
  // Searching for "aerosols" (plural) returns zero results even though searching for
  // "aerosol" (singular) returns many. The search back-end does exact matching and
  // doesn't handle pluralisation.
  test('a search for "aerosols" in var picker produces no results', async ({ page }) => {
    await page.goto('/')
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
    // Wait for the initial variable list to load before typing.
    await expect(browseVariables.locator('li.variable-list-item').first()).toBeVisible({ timeout: 15000 })

    await searchInput.fill('aerosols')
    // Click the explicit Search button rather than pressing Enter — pressing Enter
    // opens an autocomplete dropdown instead of submitting the search.
    const searchButton = browseVariables.locator('[aria-label="Search for aerosols."] button, [title="Search for aerosols."] button').first()
    const fallbackBtn = page.getByRole('button', { name: /^Search for aerosols\.$/i })
    const btn = await searchButton.isVisible().then(v => v ? searchButton : fallbackBtn)
    await btn.click({ timeout: 10000 })

    const variableItems = browseVariables.locator('li.variable-list-item')
    // status line confirms the search ran as typed, not auto-corrected to singular
    const searchStatus = browseVariables.getByText(/Browsing variables for query `aerosols`/i)
    await expect(searchStatus).toBeVisible({ timeout: 15000 })

    // FAILS while bug exists (zero results returned for the plural form), PASSES when fixed.
    await expect(variableItems.first()).toBeVisible({ timeout: 5000 })
  })

  // Bug 3 — Variable info panel closes when the mouse moves into it.
  //
  // Hovering a variable in the list shows a details panel on the right side of the dialog.
  // The moment the mouse moves from the list item into the info panel, the list item loses
  // hover state, the variable de-highlights, and the info panel disappears. This makes it
  // impossible to read the details or interact with anything in the panel.
  test('Variable info panel stays visible when mouse moves into it', async ({ page }) => {
    await page.goto('/')
    await dismissSplash(page)

    // Open the variable picker and search so there are list items to hover over.
    const addVarButton = page.locator('terra-button#add-variable-button')
    await addVarButton.scrollIntoViewIfNeeded()
    await addVarButton.click({ force: true })

    const browseVariables = page.locator('terra-browse-variables#variable-selector')
    await expect(browseVariables).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByRole('combobox', { name: /Enter search terms/i })
    await expect(searchInput).toBeVisible()
    // Wait for the initial variable list to load before typing.
    await expect(browseVariables.locator('li.variable-list-item').first()).toBeVisible({ timeout: 15000 })
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
})
