import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixtureAt,
    setIntensity,
    stubUsageReporting,
} from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

/**
 * Tracking scripts (`@type usage`) have no DOM effect: their only observable
 * behaviour is the report they POST to the local boredom server. These specs
 * stub window.fetch (see harness.stubUsageReporting) and assert the report
 * content. Fixtures are served over the fake http origin so
 * window.location.hostname is meaningful in the report payload.
 */

const USAGE_SCRIPTS: Array<{ name: string; src: string }> = [
    { name: "youtube", src: "com/youtube/youtube_usage_stats.ts" },
    { name: "instagram", src: "com/instagram/instagram_usage_stats.ts" },
    { name: "facebook", src: "com/facebook/facebook_usage_stats.ts" },
    { name: "reddit", src: "com/reddit/reddit_usage_stats.ts" },
    { name: "twitch", src: "tv/twitch/twitch_usage_stats.ts" },
];

for (const { name, src } of USAGE_SCRIPTS) {
    test(`${name} usage stats reports an opened event to the boredom server`, async ({ page }) => {
        await setIntensity(page, "medium");
        await stubUsageReporting(page);
        await loadScript(page, SRC(src));
        await openFixtureAt(page, "_shared/blank.html", "http://boredom-fixture.test/");

        await expect
            .poll(
                () =>
                    page.evaluate(() =>
                        (
                            (window as unknown as Record<string, unknown>).__FETCH_CALLS__ as Array<{
                                url: string;
                            }>
                        ).map((c) => c.url),
                    ),
                { timeout: 10_000 },
            )
            .toContain("https://127.0.0.1:12345/report/usage");

        const report = await page.evaluate(() => {
            const calls = (window as unknown as Record<string, unknown>).__FETCH_CALLS__ as Array<{
                url: string;
                body: string | null;
            }>;
            const opened = calls.find((c) => c.url.endsWith("/report/usage") && c.body);
            return opened ? JSON.parse(opened.body) : null;
        });
        expect(report.type).toBe("opened");
        expect(report.siteHostname).toBe("boredom-fixture.test");
        expect(report.currentIntensity).toBe("medium");
    });
}

test("generic usage stats reports an opened event to the boredom server", async ({ page }) => {
    await setIntensity(page, "medium");
    await stubUsageReporting(page);
    await loadScript(page, SRC("generic/generic_usage_stats.ts"));
    await openFixtureAt(page, "_shared/blank.html", "http://boredom-fixture.test/");

    await expect
        .poll(
            () =>
                page.evaluate(() =>
                    (
                        (window as unknown as Record<string, unknown>).__FETCH_CALLS__ as Array<{
                            url: string;
                        }>
                    ).map((c) => c.url),
                ),
            { timeout: 10_000 },
        )
        .toContain("https://127.0.0.1:12345/report/usage");
});

test("generic dominant color extracts the theme color and reports it", async ({ page }) => {
    await stubUsageReporting(page);
    await loadScript(page, SRC("generic/generic_dominant_color.ts"));
    // The fixture paints a solid red 64x64 image (canvas-drawn data: PNG, so
    // colorthief can read its pixels without CORS issues).
    await openFixtureAt(page, "generic/dominant-color.html", "http://boredom-fixture.test/");

    await expect
        .poll(
            () =>
                page.evaluate(() =>
                    (
                        (window as unknown as Record<string, unknown>).__FETCH_CALLS__ as Array<{
                            url: string;
                        }>
                    ).map((c) => c.url),
                ),
            { timeout: 15_000 },
        )
        .toContain("https://127.0.0.1:12345/report/theme");

    const report = await page.evaluate(() => {
        const calls = (window as unknown as Record<string, unknown>).__FETCH_CALLS__ as Array<{
            url: string;
            body: string | null;
        }>;
        const theme = calls.find((c) => c.url.endsWith("/report/theme") && c.body);
        return theme ? JSON.parse(theme.body) : null;
    });
    expect(report.siteHostname).toBe("boredom-fixture.test");
    expect(report.color).toMatch(/^#[0-9a-f]{6}$/i);
});
