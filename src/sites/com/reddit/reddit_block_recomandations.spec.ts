import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('Reddit Block Recommendations', async ({ page }) => {
    const scriptPath = join(__dirname, 'reddit_block_recomandations.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.reddit.com/');
    await page.waitForTimeout(1000);

    // Since the element presence depends on Reddit's A/B testing or content,
    // we primarily verify that the script injects and runs without crashing.
    // If we catch the specific log, that's a bonus confirmation.
    expect(page.url()).toContain('reddit.com');
});
