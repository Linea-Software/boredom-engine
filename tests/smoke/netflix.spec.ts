import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, openFixtureAt } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/netflix", name);

test("Netflix suppresses autoplay previews without hiding ordinary browse rows", async ({ page }) => {
    await loadScript(page, SRC("netflix_disable_autoplay_previews.ts"));
    await openFixture(page, "netflix/browse.html");

    await expect.poll(() => page.locator("#preview").getAttribute("data-paused-by-script")).toBe("true");
    await expect(page.locator("#normal-row")).toBeVisible();
});

test("Netflix billboard and Top 10 are independently hideable", async ({ page }) => {
    await loadScript(page, SRC("netflix_hide_billboard.ts"));
    await openFixture(page, "netflix/browse.html");
    await expect(page.locator("#billboard")).toBeHidden();
    await expect(page.locator("#top-ten")).toBeVisible();
});

test("Netflix Top 10 script leaves core browsing intact", async ({ page }) => {
    await loadScript(page, SRC("netflix_hide_top_10.ts"));
    await openFixture(page, "netflix/browse.html");
    await expect(page.locator("#top-ten")).toBeHidden();
    await expect(page.locator("#normal-row")).toBeVisible();
});

test("Netflix recommendation script is narrowly scoped", async ({ page }) => {
    await loadScript(page, SRC("netflix_hide_recommendations.ts"));
    await openFixture(page, "netflix/browse.html");
    await expect(page.locator("#recommendations")).toBeHidden();
    await expect(page.locator("#normal-row")).toBeVisible();
});

test("Netflix grayscale desaturates artwork", async ({ page }) => {
    await loadScript(page, SRC("netflix_grayscale.ts"));
    await openFixture(page, "netflix/browse.html");
    await expect.poll(() => page.locator("#netflix-art").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0)");
});

test("Netflix playback delay pauses once and resumes intentional watch playback", async ({ page }) => {
    await loadScript(page, SRC("netflix_playback_delay.ts"));
    await openFixtureAt(page, "netflix/browse.html", "http://boredom-fixture.test/watch/123");

    await page.locator("#watch-video").evaluate((video) => {
        video.dispatchEvent(new Event("play"));
    });

    await expect.poll(() => page.locator("#watch-video").getAttribute("data-pause-calls")).toBe("1");
    await expect.poll(() => page.locator("#watch-video").getAttribute("data-play-calls"), { timeout: 3_000 }).toBe("1");
});

test("Netflix playback delay does not touch browse-page previews", async ({ page }) => {
    await loadScript(page, SRC("netflix_playback_delay.ts"));
    await openFixture(page, "netflix/browse.html");
    await page.locator("#watch-video").evaluate((video) => video.dispatchEvent(new Event("play")));
    await page.waitForTimeout(100);
    await expect(page.locator("#watch-video")).not.toHaveAttribute("data-pause-calls", /.+/);
});
