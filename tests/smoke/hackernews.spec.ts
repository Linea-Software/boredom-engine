import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, openFixtureAt, setIntensity } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/ycombinator/news", name);

test("Hacker News limits the front page by intensity", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("hackernews_limit_front_page.ts"));
    await openFixtureAt(page, "hackernews/front.html", "http://boredom-fixture.test/");

    await expect(page.locator("#story-10")).toBeVisible();
    await expect(page.locator("#story-11")).toBeHidden();
    await expect(page.locator("a.morelink")).toBeHidden();
});

test("Hacker News hides scores independently", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("hackernews_hide_scores.ts"));
    await openFixture(page, "hackernews/front.html");
    await expect(page.locator("#score_1")).toBeHidden();
    await expect(page.locator("#story-1")).toBeVisible();
});

test("Hacker News hides comment counts but keeps age links", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("hackernews_hide_comment_counts.ts"));
    await openFixture(page, "hackernews/front.html");
    await expect(page.locator("#comments-1")).toHaveCSS("visibility", "hidden");
    await expect(page.locator(".age a").first()).toBeVisible();
});

test("Hacker News local repetitive-content filter caps repeated domains", async ({ page }) => {
    await setIntensity(page, "extreme");
    await loadScript(page, SRC("hackernews_filter_repetitive_content.ts"));
    await openFixture(page, "hackernews/front.html");
    await expect(page.locator("#story-1")).toBeVisible();
    await expect(page.locator("#story-2")).toBeHidden();
});

test("Hacker News grayscale desaturates the whole interface", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("hackernews_grayscale.ts"));
    await openFixture(page, "hackernews/front.html");
    await expect.poll(() => page.evaluate(() => document.documentElement.style.filter))
        .toContain("grayscale(80%)");
});
