import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      testerHtmlPath: './index.html',
      headless: true,
      // at least one instance is required
      instances: [
        { browser: 'chromium' },
      ],
    },
  }
})