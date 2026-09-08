import { expect, test } from "@playwright/test";
import { join } from "node:path";
import {
    loadScript,
    openFixture,
    openFixtureAt,
    setIntensity,
    stubReplaceState,
} from "./harness";

const SRC = (relative: string) => join(process.cwd(), "src/sites", relative);

test("instagram block explore hides explore navigation links", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_explore.ts"));
    await openFixture(page, "instagram/block-explore.html");

    await expect(page.locator('nav a[href="/explore/"]')).toBeHidden();
    await expect(page.locator('nav a[href="/"]')).toBeVisible();

    // CSS blocking applies automatically to SPA-inserted nodes; no observer or
    // periodic scan is required.
    await page.evaluate(() => {
        const link = document.createElement("a");
        link.id = "dynamic-explore";
        link.href = "/explore/";
        link.textContent = "Explore";
        document.body.appendChild(link);
    });
    await expect(page.locator("#dynamic-explore")).toBeHidden();
});

test("instagram block explore redirects away from /explore pages", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_explore.ts"));
    await page.route("https://instagram.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }),
    );
    await openFixtureAt(page, "instagram/block-explore.html", "http://boredom-fixture.test/explore");

    await expect(page).toHaveURL(/^https:\/\/instagram\.com\/?$/, { timeout: 10_000 });
});

test("instagram block explore redirects after SPA navigation", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_explore.ts"));
    await page.route("https://instagram.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }),
    );
    await openFixtureAt(page, "instagram/block-explore.html", "http://boredom-fixture.test/");

    await page.evaluate(() => history.pushState({}, "", "/explore/"));
    await expect(page).toHaveURL(/^https:\/\/instagram\.com\/?$/, { timeout: 10_000 });
});

test("instagram block reels hides reels navigation links", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_reels.ts"));
    await openFixture(page, "instagram/block-reels.html");

    await expect(page.locator('nav a[href*="/reels/"]')).toBeHidden();
    await expect(page.locator('nav a[href="/"]')).toBeVisible();
});

test("instagram block reels redirects away from /reels pages", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_reels.ts"));
    await page.route("https://instagram.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }),
    );
    await openFixtureAt(page, "instagram/block-reels.html", "http://boredom-fixture.test/reels/feed");

    await expect(page).toHaveURL(/^https:\/\/instagram\.com\/?$/, { timeout: 10_000 });
});

test("instagram block stories hides the stories tray but keeps the feed", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_stories.ts"));
    await openFixture(page, "instagram/block-stories.html");

    // CSS-driven hides (structural class + legacy class).
    await expect(page.locator("section.x6s0dn4.xrvj5dj.x1o61qjw.x12nagc.x1gslohp")).toBeHidden();
    await expect(page.locator("._aicw")).toBeHidden();
    // JS fallback: a list with story rings (canvas) and no feed articles.
    await expect(page.locator("#stories-tray")).toBeHidden();
    // The real feed (articles) must stay.
    await expect(page.locator("#feed")).toBeVisible();
});

test("instagram block suggestions hides posts after the suggestions separator", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_block_suggestions.ts"));
    await openFixture(page, "instagram/block-suggestions.html");

    await expect(page.locator('article[data-post="1"]')).toBeVisible();
    await expect(page.locator('article[data-post="2"]')).toBeHidden();
    await expect(page.locator('article[data-post="3"]')).toBeHidden();
});

test("instagram grayscale desaturates media and grays the badge color", async ({ page }) => {
    await setIntensity(page, "high"); // DESATURATION_MAP[High] = 20%
    await loadScript(page, SRC("com/instagram/instagram_grayscale.ts"));
    await openFixture(page, "instagram/grayscale.html");

    await expect
        .poll(() =>
            page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter),
        )
        .toContain("saturate(0.2)");

    // Badge color enforced via CSS variable on the document element.
    await expect
        .poll(() =>
            page.evaluate(() => document.documentElement.style.getPropertyValue("--ig-badge")),
        )
        .toBe("156, 156, 156");

    // Non-media elements must stay untouched.
    await expect
        .poll(() => page.locator("#comments").evaluate((el) => getComputedStyle(el).filter))
        .toBe("none");
});

test("instagram hide comments hides the comment button and comments list", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_hide_comments.ts"));
    await openFixture(page, "instagram/hide-comments.html");

    // CSS: speech-bubble icon signature hides the comment button + count.
    await expect(page.locator('div[role="button"][aria-label="Comment"]')).toBeHidden();
    await expect(page.locator('div[role="button"][aria-label="Comment count"]')).toBeHidden();
    // CSS: comment list container.
    await expect(page.locator("#comments-list")).toBeHidden();
    // Negative controls inside the same post action bar.
    await expect(page.locator('div[role="button"][aria-label="Like"]')).toBeVisible();
    await expect(page.locator('div[role="button"][aria-label="Share"]')).toBeVisible();
});

test("instagram hide likes hides like counts and liked-by links", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/instagram/instagram_hide_likes.ts"));
    await openFixture(page, "instagram/hide-likes.html");

    // JS fallback: heart-icon button + its count neighbour are hidden.
    await expect(page.locator('div[role="button"][aria-label="Like"]')).toBeHidden();
    await expect(page.locator('div[role="button"][aria-label="Like count"]')).toBeHidden();
    // "Liked by" section (URL-based selector) is hidden.
    await expect(page.locator("#liked-by-section")).toBeHidden();
    // Negative controls.
    await expect(page.locator('div[role="button"][aria-label="Comment"]')).toBeVisible();
    await expect(page.locator('div[role="button"][aria-label="Share"]')).toBeVisible();
});

test("instagram random captcha shows the overlay at high intensity", async ({ page }) => {
    await setIntensity(page, "high"); // gate: > Medium
    await stubReplaceState(page); // file:// pages reject cross-path replaceState
    await loadScript(page, SRC("com/instagram/instagram_random_captcha.ts"));
    await openFixture(page, "instagram/random-captcha.html");

    // First trigger is force-scheduled 15s after load.
    await expect
        .poll(
            () =>
                page.evaluate(() => ({
                    active: document.body.dataset.boredomCaptchaActive ?? null,
                    overlay: !!document.getElementById("boredom-captcha-host"),
                })),
            { timeout: 25_000 },
        )
        .toEqual({ active: "true", overlay: true });

    const calls = await page.evaluate(
        () =>
            (window as unknown as Record<string, unknown>).__REPLACE_STATE_CALLS__ as Array<{
                title: string;
                url: string;
            }>,
    );
    expect(calls[0].url).toContain("/security/captcha");
    expect(calls[0].title).toBe("Security Verification");
});
