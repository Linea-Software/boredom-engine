import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixture,
    setIntensity,
    stubMathRandom,
} from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

test("twitch grayscale desaturates media and grays the brand colors", async ({ page }) => {
    await setIntensity(page, "high"); // DESATURATION_MAP[High] = 20%, gray #666666
    await loadScript(page, SRC("tv/twitch/twitch_grayscale.ts"));
    await openFixture(page, "twitch/grayscale.html");

    await expect
        .poll(() => page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");

    await expect
        .poll(() =>
            page.evaluate(() => document.documentElement.style.getPropertyValue("--color-twitch-purple")),
        )
        .toBe("#666666");

    await expect
        .poll(() => page.locator("#chat").evaluate((el) => getComputedStyle(el).filter))
        .toBe("none");
});

test("twitch media quality overlays a canvas on video and pixelates images", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("tv/twitch/twitch_media_quality.ts"));
    await openFixture(page, "twitch/media-quality.html");

    await expect
        .poll(() => page.locator("#vwrap").evaluate((el) => getComputedStyle(el).position))
        .toBe("relative");
    await expect
        .poll(() => page.locator("#vwrap canvas").count())
        .toBeGreaterThanOrEqual(1);
    await expect
        .poll(() => page.locator("#player-video").evaluate((el) => getComputedStyle(el).opacity))
        .toBe("0");

    await expect
        .poll(() =>
            page.locator("#thumbnail").evaluate((el) => (el as HTMLElement).style.imageRendering),
        )
        .toBe("pixelated");
});

test("twitch random captcha shows the overlay at high intensity", async ({ page }) => {
    await setIntensity(page, "high"); // gate: > Medium
    await loadScript(page, SRC("tv/twitch/twitch_random_captcha.ts"));
    await openFixture(page, "twitch/random-captcha.html");

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

test("twitch remove featured carousel hides the carousel without detaching it", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("tv/twitch/twitch_remove_featured_carousel.ts"));
    await openFixture(page, "twitch/remove-featured-carousel.html");

    // Keep Twitch-owned DOM attached; declarative CSS is enough to keep both
    // current and future carousel nodes hidden without fighting React.
    await expect(page.locator("#carousel")).toHaveCount(1);
    await expect(page.locator("#carousel")).toBeHidden();
    await expect
        .poll(() => page.locator("#carousel-video").evaluate((el) => (el as HTMLVideoElement).muted))
        .toBe(true);
    await expect(page.locator("#channel-grid")).toBeVisible();

    await page.evaluate(() => {
        const carousel = document.createElement("div");
        carousel.id = "dynamic-carousel";
        carousel.className = "front-page-carousel";
        document.body.appendChild(carousel);
    });
    await expect(page.locator("#dynamic-carousel")).toBeHidden();
});

test("twitch remove sidebar hides the navigation sidebar", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("tv/twitch/twitch_remove_sidebar.ts"));
    await openFixture(page, "twitch/remove-sidebar.html");

    // Stable/structural CSS selectors hide the sidebar without polling.
    await expect(page.locator("#sidebar")).toBeHidden();
    await expect(page.locator("#content")).toBeVisible();
});

test("twitch video delay pauses playback on a buffering roll", async ({ page }) => {
    await setIntensity(page, "medium"); // 10% roll chance
    await stubMathRandom(page, 0); // force every chance roll to succeed
    await loadScript(page, SRC("tv/twitch/twitch_video_delay.ts"));
    await openFixture(page, "twitch/video-delay.html");

    await expect
        .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__pauseCalls ?? 0), {
            timeout: 10_000,
        })
        .toBeGreaterThanOrEqual(1);
});
