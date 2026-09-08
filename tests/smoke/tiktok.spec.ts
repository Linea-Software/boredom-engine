import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixture,
    setIntensity,
    stubMathRandom,
} from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

test("tiktok block main content hides the FYP container and mutes its media", async ({ page }) => {
    await setIntensity(page, "medium"); // gate: > None but skips Low
    await loadScript(page, SRC("com/tiktok/tiktok_block_main_content.ts"));
    await openFixture(page, "tiktok/block-main-content.html");

    await expect(page.locator("#main-content-homepage_hot")).toBeHidden();
    await expect(page.locator("#sidebar")).toBeVisible();

    // The shared blocker suppresses media inside the hidden feed without polling.
    await expect
        .poll(() => page.locator("#fyp-video").evaluate((el) => (el as HTMLVideoElement).muted))
        .toBe(true);
});

test("tiktok desaturate desaturates media and grays the UI colors", async ({ page }) => {
    await setIntensity(page, "high"); // DESATURATION_MAP[High] = 20%
    await loadScript(page, SRC("com/tiktok/tiktok_desaturate.ts"));
    await openFixture(page, "tiktok/desaturate.html");

    await expect
        .poll(() => page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");

    // Module-scope enforceCssVariables (runs before DOMContentLoaded).
    await expect
        .poll(() =>
            page.evaluate(() => document.documentElement.style.getPropertyValue("--tux-colorPrimary")),
        )
        .toBe("gray");
    // Backup stylesheet also forces the link color.
    await expect
        .poll(() =>
            page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--tux-colorLink")),
        )
        .toBe("gray");
});

test("tiktok downgrade media quality overlays a canvas on video and pixelates images", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("com/tiktok/tiktok_downgrade_media_quality.ts"));
    await openFixture(page, "tiktok/downgrade-media-quality.html");

    // degradeVideo: parent becomes relative, canvas overlay is appended,
    // and the real video is visually hidden (opacity 0).
    await expect
        .poll(() => page.locator("#vwrap").evaluate((el) => getComputedStyle(el).position))
        .toBe("relative");
    await expect
        .poll(() => page.locator("#vwrap canvas").count())
        .toBeGreaterThanOrEqual(1);
    await expect
        .poll(() => page.locator("#player-video").evaluate((el) => getComputedStyle(el).opacity))
        .toBe("0");

    // degradeImage: instant CSS downgrade is applied regardless of canvas.
    await expect
        .poll(() =>
            page.locator("#thumbnail").evaluate((el) => (el as HTMLElement).style.imageRendering),
        )
        .toBe("pixelated");
});

test("tiktok remove sidebar buttons hides the more/explore/live entries", async ({ page }) => {
    await setIntensity(page, "medium"); // gate: > None but skips Low
    await loadScript(page, SRC("com/tiktok/tiktok_remove_sidebar_buttons.ts"));
    await openFixture(page, "tiktok/remove-sidebar-buttons.html");

    await expect(page.locator("#more-btn")).toBeHidden();
    await expect(page.locator("#explore-btn")).toBeHidden();
    await expect(page.locator("#live-btn")).toBeHidden();

    // Negative controls (nav items not on the removal list).
    await expect(page.locator("#home-btn")).toBeVisible();
    await expect(page.locator("#following-btn")).toBeVisible();
    await expect(page.locator("#extra-btn")).toBeVisible();
});

test("tiktok video delay shows the buffering spinner and pauses playback", async ({ page }) => {
    await setIntensity(page, "medium"); // 10% roll chance
    await stubMathRandom(page, 0); // force every chance roll to succeed
    await loadScript(page, SRC("com/tiktok/tiktok_video_delay.ts"));
    await openFixture(page, "tiktok/video-delay.html");

    // The spinner is injected next to the video and shown while "buffering".
    await expect
        .poll(() => page.locator("#vwrap .boredom-tiktok-spinner").count(), { timeout: 10_000 })
        .toBeGreaterThanOrEqual(1);
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    (document.querySelector(".boredom-tiktok-spinner") as HTMLElement | null)?.style
                        .display ?? "",
            ),
        )
        .toBe("block");
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__pauseCalls ?? 0))
        .toBeGreaterThanOrEqual(1);
});
