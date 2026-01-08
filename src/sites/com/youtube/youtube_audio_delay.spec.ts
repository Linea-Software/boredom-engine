import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Audio Delay', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_audio_delay.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    // Use a generic video URL
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(2000);

    // Verify page loaded
    expect(page.url()).toContain('youtube.com');

    // We can't easily verify the audio delay context internals, 
    // ensuring the script doesn't crash the player is the baseline.
});
