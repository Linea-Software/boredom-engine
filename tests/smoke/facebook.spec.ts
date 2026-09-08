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

test("facebook block feed hides the feed and blocks feed requests", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_block_feed.ts"));
    await openFixture(page, "facebook/block-feed.html");

    await expect(page.locator("#news-feed")).toBeHidden();
    await expect(page.locator("#suggested")).toBeHidden();
    await expect(page.locator("#groups")).toBeVisible();

    // Feed-related fetch patterns are short-circuited with a 404.
    const statuses = await page.evaluate(async () => {
        const graphql = await fetch("/api/graphql/feed").then((r) => r.status);
        const feed = await fetch("feed.php").then((r) => r.status);
        return { graphql, feed };
    });
    expect(statuses).toEqual({ graphql: 404, feed: 404 });
});

test("facebook block reels hides reels navigation links", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_block_reels.ts"));
    await openFixture(page, "facebook/block-reels.html");

    await expect(page.locator('a[href*="/reel/"]')).toBeHidden();
    await expect(page.locator('a[href="/reel/123"]')).toBeHidden();
    await expect(page.locator('a[aria-label="Reels"]')).toBeHidden();
    await expect(page.locator('a[href="/"]')).toBeVisible();
});

test("facebook block reels redirects away from reels pages", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_block_reels.ts"));
    await page.route("https://www.facebook.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }),
    );
    await openFixtureAt(page, "facebook/block-reels.html", "http://boredom-fixture.test/reels/watch");

    await expect(page).toHaveURL(/^https:\/\/www\.facebook\.com\/?$/, { timeout: 10_000 });
});

test("facebook block sidebar hides navigation sidebars but keeps the main menu", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_block_sidebar.ts"));
    await openFixture(page, "facebook/block-sidebar.html");

    await expect(page.locator("#left-nav")).toBeHidden();
    await expect(page.locator("#right-sidebar")).toBeHidden();
    await expect(page.locator("#suggestions")).toBeHidden();
    // Main menu explicitly excluded by the :not([aria-label*="Main"]) rule.
    await expect(page.locator("#main-nav")).toBeVisible();
});

test("facebook block stories hides the stories tray but keeps the feed", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_block_stories.ts"));
    await openFixture(page, "facebook/block-stories.html");

    await expect(page.locator("#stories")).toBeHidden();
    await expect(page.locator("#feed")).toBeVisible();
});

test("facebook grayscale desaturates media", async ({ page }) => {
    await setIntensity(page, "high"); // DESATURATION_MAP[High] = 20%
    await loadScript(page, SRC("com/facebook/facebook_grayscale.ts"));
    await openFixture(page, "facebook/grayscale.html");

    await expect
        .poll(() => page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");

    // Non-media elements must stay untouched.
    await expect
        .poll(() => page.locator("#comments").evaluate((el) => getComputedStyle(el).filter))
        .toBe("none");
});

test("facebook hide comments hides the comment area but keeps the post", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_hide_comments.ts"));
    await openFixture(page, "facebook/hide-comments.html");

    // Semantic aria selectors hide the comment controls/count/input; with no
    // visible children left, the dedicated comment area collapses as well.
    await expect(page.locator("#comments-area")).toBeHidden();
    // Negative control: the post article stays.
    await expect(page.locator("#post")).toBeVisible();
    await expect(page.locator('#post div[role="button"][aria-label="Like"]')).toBeVisible();
});

test("facebook hide reactions hides reaction counts but keeps unrelated text", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("com/facebook/facebook_hide_reactions.ts"));
    await openFixture(page, "facebook/hide-reactions.html");

    await expect(page.locator('span[aria-label="12 reactions"]')).toBeHidden();
    await expect(page.locator("span", { hasText: "42 likes" })).toBeHidden();
    await expect(page.locator("span", { hasText: "Hello world" })).toBeVisible();
    await expect(page.locator('div[role="button"][aria-label="Comment"]')).toBeVisible();
});

test("facebook random captcha shows the overlay at high intensity", async ({ page }) => {
    await setIntensity(page, "high"); // gate: > Medium
    await stubReplaceState(page); // file:// pages reject cross-path replaceState
    await loadScript(page, SRC("com/facebook/facebook_random_captcha.ts"));
    await openFixture(page, "facebook/random-captcha.html");

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
