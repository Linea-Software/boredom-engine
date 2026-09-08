import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixture,
    openFixtureAt,
    setIntensity,
    stubAudioContext,
    stubMathRandom,
    stubReplaceState,
} from "./harness";

// Absolute paths to script sources; the harness bundles them with esbuild
// (resolving the $common alias via tsconfig.json) and injects them before the
// fixture page's own scripts run. Resolved from the repo root (see harness.ts).
const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

test("youtube audio delay wires a DelayNode with the intensity-scaled delay", async ({ page }) => {
    await setIntensity(page, "high"); // AUDIO_DELAY_MAP[High] = 3s
    await stubAudioContext(page);
    await loadScript(page, SRC("com/youtube/youtube_audio_delay.ts"));
    await openFixture(page, "youtube/audio-delay.html");

    // The script polls for a <video> every 2s, then routes its audio through a
    // DelayNode. Assert the wiring (delay mechanism), not the actual 3s delay.
    await expect
        .poll(
            () =>
                page.evaluate(() => {
                    const s = (window as unknown as Record<string, unknown>).__AUDIO_STUB__ as {
                        sources: unknown[];
                        delays: Array<{ node: { delayTime: { value: number } } }>;
                    };
                    return { sources: s.sources.length, delayValue: s.delays[0]?.node.delayTime.value };
                }),
            { timeout: 10_000 },
        )
        .toEqual({ sources: 1, delayValue: 3 });
});

test("youtube low quality forces the intensity-mapped playback quality", async ({ page }) => {
    await setIntensity(page, "high"); // QUALITY_MAP[High] = "small" (240p)
    await loadScript(page, SRC("com/youtube/youtube_low_quality.ts"));
    // Fixture lives under fixtures/youtube/watch/ so window.location.href
    // contains "/watch" — the script's gate for forcing player quality.
    await openFixture(page, "youtube/watch/low-quality.html");

    await expect
        .poll(
            () => page.evaluate(() => (window as unknown as Record<string, unknown>).__qualityCalls),
            { timeout: 10_000 },
        )
        .toContainEqual(["quality", "small"]);

    const calls = await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__qualityCalls as unknown[][],
    );
    expect(calls).toContainEqual(["range", "small", "small"]);
});

test("youtube random captcha shows the overlay and spoofs the URL at high intensity", async ({ page }) => {
    await setIntensity(page, "high"); // gate: > Medium
    // replaceState throws on file:// pages (opaque origin); the stub records
    // the URL-spoofing call so the logic can still be asserted.
    await stubReplaceState(page);
    await loadScript(page, SRC("com/youtube/youtube_random_captcha.ts"));
    await openFixture(page, "youtube/random-captcha.html");

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

    const calls = await page.evaluate(
        () =>
            (window as unknown as Record<string, unknown>).__REPLACE_STATE_CALLS__ as Array<{
                title: string;
                url: string;
            }>,
    );
    expect(calls[0].url).toContain("/recaptcha/api2/anchor");
    expect(calls[0].title).toBe("Security Verification");

    // The overlay renders into an open shadow root (Lit).
    await expect(page.locator("#boredom-captcha-host .boredom-captcha-overlay")).toBeVisible();
});

test("youtube shorts remove hides Shorts surfaces without detaching them", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/youtube/youtube_shorts_remove.ts"));
    await openFixture(page, "youtube/remove-shorts.html");

    await expect(page.locator("#shelf [is-shorts]").first()).toBeHidden();
    await expect(page.locator("#shelf span:not([is-shorts])")).toBeVisible();
    await expect(page.locator("#shorts-inner-container")).toHaveCount(1);
    await expect(page.locator("#shorts-inner-container")).toBeHidden();
    await expect(page.locator("div#items a[title='Shorts']")).toBeHidden();
    await expect(page.locator("div#items a[title='Home']")).toBeVisible();
    await expect(page.locator("div#items").nth(1).locator("yt-formatted-string.title")).toBeHidden();
    await expect(page.locator("div#items").nth(2).locator("yt-formatted-string.title")).toBeVisible();
});

test("youtube shorts remove redirects away from /shorts pages", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/youtube/youtube_shorts_remove.ts"));
    // Intercept the redirect target so no real network is involved.
    await page.route("https://youtube.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }),
    );
    await openFixtureAt(page, "youtube/remove-shorts.html", "http://boredom-fixture.test/shorts/abc");

    await expect(page).toHaveURL(/^https:\/\/youtube\.com\/?$/, { timeout: 10_000 });
});

test("youtube video buffer delay pauses playback and shows the buffering spinner", async ({ page }) => {
    await setIntensity(page, "high"); // 20% roll chance per check
    await stubMathRandom(page, 0); // force every chance roll to succeed
    await loadScript(page, SRC("com/youtube/youtube_video_buffer_delay.ts"));
    await openFixture(page, "youtube/video-buffer-delay.html");

    // The buffer cycle lasts ~3s at high intensity; assert the active state
    // and the delay mechanism rather than waiting the cycle out.
    await expect
        .poll(
            () => page.evaluate(() => document.body.dataset.boredomBufferingActive ?? null),
            { timeout: 10_000 },
        )
        .toBe("true");
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__pauseCalls ?? 0))
        .toBeGreaterThanOrEqual(1);
    await expect
        .poll(() =>
            page.evaluate(() => (document.querySelector(".ytp-spinner") as HTMLElement).style.display),
        )
        .toBe("block");
});
