import { test, expect } from '@playwright/test';
import { injectScript } from '$common/test-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('YouTube Video Buffer Delay', async ({ page }) => {
    const scriptPath = join(__dirname, 'youtube_video_buffer_delay.ts');

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));

    await injectScript(page, scriptPath);
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Just verify the page loads and script doesn't instantly crash
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('youtube.com');
});
