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
    await page.waitForTimeout(1000);

    // Verify the element is NOT present (either removed or never existed)
    // The target XPath from the script
    const targetXpath = '//*[@id="root"]/div[1]/div[1]/div[2]/main/div[1]/div/div/div[1]';
    const elementCount = await page.locator(targetXpath).count();

    expect(elementCount).toBe(0);
});
