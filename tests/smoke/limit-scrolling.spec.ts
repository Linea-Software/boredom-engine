import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, setIntensity } from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

/**
 * Shared assertion for the three limit-scrolling scripts. The shared
 * `_shared/tall-page.html` fixture is 10000px tall; at high intensity the
 * allowed depth is 1.5 viewport heights.
 */
async function assertScrollClamped(page: Page): Promise<void> {
    // Jump far past the allowed depth.
    await page.evaluate(() => window.scrollTo(0, 9000));

    // The limit is enforced by appending a style that kills the page height.
    await expect(page.locator("#boredom-scroll-limit-style")).toHaveCount(1);

    // The scroll position is snapped back to the limit and the page cannot
    // overflow anymore.
    await expect
        .poll(() =>
            page.evaluate(() => ({
                clamped: window.scrollY <= window.innerHeight * 1.5 + 50,
                overflow: getComputedStyle(document.body).overflow,
            })),
        )
        .toMatchObject({ clamped: true, overflow: "hidden" });
}

test("youtube limit scrolling clamps scroll depth at high intensity", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/youtube/youtube_limit_scrolling.ts"));
    await openFixture(page, "_shared/tall-page.html");

    await assertScrollClamped(page);
});

test("youtube limit scrolling activates and releases on live intensity changes", async ({ page }) => {
    await setIntensity(page, "none");
    await loadScript(page, SRC("com/youtube/youtube_limit_scrolling.ts"));
    await openFixture(page, "_shared/tall-page.html");

    await page.evaluate(() => window.scrollTo(0, 9000));
    await expect(page.locator("#boredom-scroll-limit-style")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(5000);

    await page.evaluate(() => {
        (window as any).__BOREDOM_INTENSITY__ = "high";
        window.dispatchEvent(new Event("boredom-engine:intensitychange"));
    });
    await assertScrollClamped(page);

    await page.evaluate(() => {
        (window as any).__BOREDOM_INTENSITY__ = "none";
        window.dispatchEvent(new Event("boredom-engine:intensitychange"));
    });
    await expect(page.locator("#boredom-scroll-limit-style")).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 9000));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(5000);
});

test("facebook limit scrolling clamps scroll depth at high intensity", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_limit_scrolling.ts"));
    await openFixture(page, "_shared/tall-page.html");

    await assertScrollClamped(page);
});

test("reddit limit scrolling clamps scroll depth at high intensity", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/reddit/reddit_limit_scrolling.ts"));
    await openFixture(page, "_shared/tall-page.html");

    await assertScrollClamped(page);
});

for (const [site, relative] of [
    ["X", "com/x/x_limit_scrolling.ts"],
    ["LinkedIn", "com/linkedin/linkedin_limit_scrolling.ts"],
    ["Pinterest", "com/pinterest/pinterest_limit_scrolling.ts"],
    ["Threads", "net/threads/threads_limit_scrolling.ts"],
    ["Hacker News", "com/ycombinator/news/hackernews_limit_scrolling.ts"],
    ["Snapchat", "com/snapchat/snapchat_limit_scrolling.ts"],
] as const) {
    test(`${site} limit scrolling clamps scroll depth at high intensity`, async ({ page }) => {
        await setIntensity(page, "high");
        await loadScript(page, SRC(relative));
        await openFixture(page, "_shared/tall-page.html");

        await assertScrollClamped(page);
    });
}
