import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, setIntensity } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/net/threads", name);

test("Threads hides For You, switches to Following, and survives a feed-tab rerender", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("threads_block_for_you.ts"));
    await openFixture(page, "threads/home.html");

    await expect(page.locator("#threads-for-you")).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.dataset.followingClicked)).toBe("true");

    await page.evaluate(() => {
        (window as unknown as { replaceThreadsTabs: () => void }).replaceThreadsTabs();
    });
    await expect.poll(() => page.evaluate(() => document.body.dataset.followingClicked)).toBe("true");
});

test("Threads hides suggestions while preserving navigation", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("threads_hide_suggestions.ts"));
    await openFixture(page, "threads/home.html");
    await expect(page.locator("#threads-suggestions")).toBeHidden();
    await expect(page.locator("#threads-nav")).toBeVisible();
});

test("Threads hides engagement counts while preserving action buttons", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("threads_hide_engagement_metrics.ts"));
    await openFixture(page, "threads/home.html");
    await expect(page.locator("#threads-like-count")).toHaveCSS("visibility", "hidden");
    await expect(page.locator('button[aria-label="Like"]')).toBeVisible();
});

test("Threads grayscale desaturates media", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("threads_grayscale.ts"));
    await openFixture(page, "threads/home.html");
    await expect.poll(() => page.locator("#threads-media").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");
});
