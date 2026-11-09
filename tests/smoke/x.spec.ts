import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, openFixtureAt } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/x", name);

test("X blocks For You and follows dynamically re-rendered tabs", async ({ page }) => {
    await loadScript(page, SRC("x_block_for_you.ts"));
    await openFixtureAt(page, "x/home.html", "http://boredom-fixture.test/home");

    await expect(page.locator("#for-you")).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.dataset.followingClicked)).toBe("true");

    await page.evaluate(() => {
        (window as unknown as { replaceXTabs: () => void }).replaceXTabs();
    });
    await expect(page.locator("#late-for-you")).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.dataset.followingClicked)).toBe("true");
});

test("X hides trends without hiding intentional navigation", async ({ page }) => {
    await loadScript(page, SRC("x_hide_trends.ts"));
    await openFixture(page, "x/home.html");

    await expect(page.locator("#trends")).toBeHidden();
    await expect(page.locator("#intentional-nav")).toBeVisible();
});

test("X hides account suggestions independently", async ({ page }) => {
    await loadScript(page, SRC("x_hide_suggestions.ts"));
    await openFixture(page, "x/home.html");

    await expect(page.locator("#suggestion")).toBeHidden();
    await expect(page.locator("#trends")).toBeVisible();
});

test("X hides engagement counts but preserves action controls", async ({ page }) => {
    await loadScript(page, SRC("x_hide_engagement_metrics.ts"));
    await openFixture(page, "x/home.html");

    await expect(page.locator("#like-count")).toHaveCSS("visibility", "hidden");
    await expect(page.locator('button[data-testid="like"]')).toBeVisible();
    await expect(page.locator("#tweet")).toBeVisible();
});

test("X grayscale desaturates media", async ({ page }) => {
    await loadScript(page, SRC("x_grayscale.ts"));
    await openFixture(page, "x/home.html");

    await expect.poll(() => page.locator("#x-media").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0)");
});

test("X captcha wrapper uses the shared independent interruption", async ({ page }) => {
    await page.clock.install();
    await loadScript(page, SRC("x_random_captcha.ts"));
    await openFixture(page, "x/home.html");

    await page.clock.fastForward(15_000);
    await expect(page.locator("#boredom-captcha-host")).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => document.body.dataset.boredomCaptchaActive)).toBe("true");
});
