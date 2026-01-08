import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('Reddit Posts Grayscale', async ({ page }) => {
    const scriptPath = join(__dirname, 'reddit_posts_grayscale.ts');

    // Enable console logging
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    // Inject the script (before navigation so it runs on load)
    await injectScript(page, scriptPath);

    // Navigate to Reddit
    await page.goto('https://www.reddit.com/');

    // Allow some time for the script to execute (onMount)
    await page.waitForTimeout(1000);

    // Check if the style has been injected
    // The applyMediaGrayscale function injects a style tag with the filter rule.
    // We look for a style tag containing "shreddit-player" and "filter: saturate(20%)".

    const styleExists = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style'));
        return styles.some(s =>
            s.textContent?.includes('shreddit-player') &&
            s.textContent?.includes('filter: saturate(20%)')
        );
    });

    expect(styleExists).toBe(true);

    // Optional: Check computed style on an image if possible, but selectors might be dynamic.
    // For now, trusting the injected CSS existence is a good first step.
});
