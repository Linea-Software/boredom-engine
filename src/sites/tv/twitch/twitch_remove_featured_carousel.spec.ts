import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('Twitch Remove Featured Carousel', async ({ page }) => {
    const scriptPath = join(__dirname, 'twitch_remove_featured_carousel.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.twitch.tv/');
    // Wait for potential carousel load
    await page.waitForTimeout(2000);

    // Selectors that should NOT be visible
    const selectors = [
        '[data-a-target="front-page-carousel"]',
        '.front-page-carousel'
    ];

    for (const selector of selectors) {
        await expect(page.locator(selector)).toBeHidden();
    }
});
