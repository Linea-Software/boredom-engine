import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixture,
    openFixtureAt,
    setIntensity,
    stubMathRandom,
} from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

test("reddit block recommendations hides the recommendation column on the homepage", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/reddit/reddit_block_recomandations.ts"));
    // The script only acts when window.location.pathname is "/", which a
    // Windows file:// fixture can never produce — serve over the fake origin.
    await openFixtureAt(page, "reddit/block-recommendations.html", "http://boredom-fixture.test/");

    // The fixture appends a node after load to trigger the MutationObserver
    // (the script has no initial scan, matching Reddit's SPA behaviour).
    await expect(page.locator("#recommendation")).toBeHidden();
    await expect(page.locator("#regular-post")).toBeVisible();
});

test("reddit grayscale desaturates media and grays the brand colors", async ({ page }) => {
    await setIntensity(page, "high"); // DESATURATION_MAP[High] = 20%, gray #666666
    await loadScript(page, SRC("com/reddit/reddit_grayscale.ts"));
    await openFixture(page, "reddit/grayscale.html");

    await expect
        .poll(() => page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");

    await expect
        .poll(() =>
            page.evaluate(() => document.documentElement.style.getPropertyValue("--color-brand-background")),
        )
        .toBe("#666666");

    await expect
        .poll(() => page.locator("#comments").evaluate((el) => getComputedStyle(el).filter))
        .toBe("none");
});

test("reddit random captcha shows the overlay at high intensity", async ({ page }) => {
    await setIntensity(page, "high"); // gate: > Medium
    await loadScript(page, SRC("com/reddit/reddit_random_captcha.ts"));
    await openFixture(page, "reddit/random-captcha.html");

    // First trigger is force-scheduled 5s after load.
    await expect
        .poll(
            () =>
                page.evaluate(() => ({
                    active: document.body.dataset.boredomCaptchaActive ?? null,
                    overlay: !!document.getElementById("boredom-captcha-host"),
                })),
            { timeout: 15_000 },
        )
        .toEqual({ active: "true", overlay: true });
    await expect(page.locator("#boredom-captcha-host .boredom-captcha-overlay")).toBeVisible();
});

test("reddit video delay pauses playback on a buffering roll", async ({ page }) => {
    await setIntensity(page, "medium"); // gate: > Low; 10% roll chance
    await stubMathRandom(page, 0); // force every chance roll to succeed
    await loadScript(page, SRC("com/reddit/reddit_video_delay.ts"));
    await openFixture(page, "reddit/video-delay.html");

    // Outer scan every 2s + per-video check every 1s; assert the pause
    // mechanism (recorded on the stubbed video) rather than the delay itself.
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__pauseCalls ?? 0), {
            timeout: 10_000,
        })
        .toBeGreaterThanOrEqual(1);
});
