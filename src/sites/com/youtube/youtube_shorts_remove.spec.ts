import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Shorts Remove', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_shorts_remove.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.youtube.com/');
    await page.waitForTimeout(1000);

    // Check if the style that hides shorts is injected
    const styleExists = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style'));
        return styles.some(s =>
            s.textContent?.includes('[is-shorts]') &&
            s.textContent?.includes('display: none')
        );
    });

    expect(styleExists).toBe(true);
});
