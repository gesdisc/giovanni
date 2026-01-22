import { page } from 'vitest/browser'

export async function dismissModalIfPresent() {
    const skipButton = page.getByTestId('welcome-splash--skip-button')
    
    if (await skipButton.query()) { // or use .count() > 0
        await skipButton.click()
        await new Promise(resolve => setTimeout(resolve, 300)) // wait for animation
    }
}