import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke tests for the resistance scripts (release plan Step 5.4).
 *
 * The harness never needs real network access: mock fixture pages are inlined
 * with `page.setContent` and script sources are bundled in-memory with esbuild
 * (see ./harness.ts and src/common/test-utils.ts).
 */
export default defineConfig({
    testDir: ".",
    testMatch: /.*\.spec\.ts/,
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
    ],
    use: {
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
