import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Auto Logout', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_auto_logout.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.youtube.com/');
    await page.waitForTimeout(1000);

    // Check if the script initialized localStorage
    const lastActive = await page.evaluate(() => localStorage.getItem("be_yt_last_active"));
    expect(lastActive).toBeTruthy();
});
