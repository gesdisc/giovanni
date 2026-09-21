import { test as base, expect } from '@playwright/test'
import { installApiMocks } from './mocks'

/**
 * Drop-in replacement for `@playwright/test`'s `test` that automatically
 * installs network mocks (Harmony, Giovanni catalog, CMR, GES DISC, EDL,
 * GSFC alerts) before every test, so specs never depend on those live
 * services being reachable.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await installApiMocks(page)
    await use(page)
  },
})

export { expect }
export * from './mocks'
