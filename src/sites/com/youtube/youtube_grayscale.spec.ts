import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Grayscale', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_grayscale.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.youtube.com/');
    await page.waitForTimeout(1000);

    // Check if the style has been injected
    const styleExists = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style'));
        return styles.some(s =>
            s.textContent?.includes('filter: saturate') ||
            s.textContent?.includes('filter: grayscale')
        );
    });

    expect(styleExists).toBe(true);
});
