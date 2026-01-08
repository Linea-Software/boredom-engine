import { type Page } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

/**
 * Compiles and injects a script into the page.
 * @param page Playwright Page object
 * @param scriptPath Absolute path to the script file
 */
export async function injectScript(page: Page, scriptPath: string) {
    // Build the script into memory
    const result = await build({
        entryPoints: [scriptPath],
        bundle: true,
        write: false,
        platform: 'browser',
        target: 'es2020',
        minify: false, // Keep it readable for debugging if needed
        tsconfig: 'tsconfig.json',
    });

    if (!result.outputFiles || result.outputFiles.length === 0) {
        throw new Error(`Failed to build script: ${scriptPath}`);
    }

    const code = result.outputFiles[0].text;

    // Inject the script to run before other scripts on the page
    await page.addInitScript({
        content: `
      (function() {
        console.log("Injecting test script: ${scriptPath}");
        try {
            ${code}
        } catch (e) {
            console.error("Error executing injected script:", e);
        }
      })();
    `,
    });
}
