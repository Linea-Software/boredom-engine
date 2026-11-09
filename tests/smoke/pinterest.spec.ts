import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, openFixtureAt } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/pinterest", name);

test("Pinterest blocks the home feed while preserving search, boards, and an opened pin", async ({ page }) => {
    await loadScript(page, SRC("pinterest_block_home_feed.ts"));
    await openFixtureAt(page, "pinterest/home.html", "http://boredom-fixture.test/");

    await expect(page.locator("#home-feed")).toBeHidden();
    await expect(page.locator("#opened-pin")).toBeVisible();
    await expect(page.locator('a[href^="/search/"]')).toBeVisible();
    await expect(page.locator('a[href*="/boards/"]')).toBeVisible();
});

test("Pinterest blocks related pins independently", async ({ page }) => {
    await loadScript(page, SRC("pinterest_block_related_pins.ts"));
    await openFixture(page, "pinterest/home.html");
    await expect(page.locator("#related-pins")).toBeHidden();
    await expect(page.locator("#opened-pin")).toBeVisible();
});

test("Pinterest removes Explore navigation without hiding search", async ({ page }) => {
    await loadScript(page, SRC("pinterest_block_explore.ts"));
    await openFixture(page, "pinterest/home.html");
    await expect(page.locator("#ideas-link")).toBeHidden();
    await expect(page.locator('a[href^="/search/"]')).toBeVisible();
});

test("Pinterest hides suggestion modules independently", async ({ page }) => {
    await loadScript(page, SRC("pinterest_hide_suggestions.ts"));
    await openFixture(page, "pinterest/home.html");
    await expect(page.locator("#pin-suggestions")).toBeHidden();
    await expect(page.locator("#related-pins")).toBeVisible();
});

test("Pinterest grayscale desaturates pins", async ({ page }) => {
    await loadScript(page, SRC("pinterest_grayscale.ts"));
    await openFixture(page, "pinterest/home.html");
    await expect.poll(() => page.locator("#pinterest-media").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0)");
});
