import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, openFixtureAt, setIntensity } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/linkedin", name);

test("LinkedIn block feed preserves navigation and hides late-inserted feed content", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("linkedin_block_feed.ts"));
    await openFixtureAt(page, "linkedin/feed.html", "http://boredom-fixture.test/feed/");

    await expect(page.locator("#main-feed")).toBeHidden();
    await expect(page.locator("#linkedin-nav")).toBeVisible();

    await page.evaluate(() => {
        const late = document.createElement("section");
        late.id = "late-feed";
        late.dataset.testid = "mainFeed";
        late.textContent = "Late feed";
        document.body.appendChild(late);
    });
    await expect(page.locator("#late-feed")).toBeHidden();
});

test("LinkedIn news and suggestions are independently suppressible", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("linkedin_hide_news.ts"));
    await openFixture(page, "linkedin/feed.html");
    await expect(page.locator("#linkedin-news")).toBeHidden();
    await expect(page.locator("#linkedin-suggestions")).toBeVisible();
});

test("LinkedIn hides recommendation modules independently", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("linkedin_hide_suggestions.ts"));
    await openFixture(page, "linkedin/feed.html");
    await expect(page.locator("#linkedin-suggestions")).toBeHidden();
    await expect(page.locator("#linkedin-news")).toBeVisible();
});

test("LinkedIn hides social counts while preserving the post", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("linkedin_hide_engagement_metrics.ts"));
    await openFixture(page, "linkedin/feed.html");
    await expect(page.locator("#social-counts")).toHaveCSS("visibility", "hidden");
    await expect(page.locator("#post")).toBeVisible();
});

test("LinkedIn grayscale desaturates media", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("linkedin_grayscale.ts"));
    await openFixture(page, "linkedin/feed.html");
    await expect.poll(() => page.locator("#linkedin-media").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");
});
