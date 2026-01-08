import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Random Captcha', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_random_captcha.ts');

    let logFound = false;
    page.on('console', msg => {
        if (msg.text().includes('[Boredom Engine] Next YouTube captcha')) {
            logFound = true;
        }
        console.log(`PAGE LOG: ${msg.text()}`)
    });

    await injectScript(page, scriptPath);
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(2000); // Wait for onMount execution

    expect(logFound).toBe(true);
});
