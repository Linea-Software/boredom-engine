import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, setIntensity } from "./harness";

const SRC = (name: string) => join(process.cwd(), "src/sites/com/snapchat", name);

test("Snapchat blocks Spotlight while preserving direct chat", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("snapchat_block_spotlight.ts"));
    await openFixture(page, "snapchat/web.html");
    await expect(page.locator("#spotlight-link")).toBeHidden();
    await expect(page.locator("#chat-main")).toBeVisible();
    await expect(page.locator("#chat-link")).toBeVisible();
});

test("Snapchat blocks Discover independently", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("snapchat_block_discover.ts"));
    await openFixture(page, "snapchat/web.html");
    await expect(page.locator("#discover-link")).toBeHidden();
    await expect(page.locator("#spotlight-link")).toBeVisible();
});

test("Snapchat hides suggestion modules without hiding messages", async ({ page }) => {
    await setIntensity(page, "medium");
    await loadScript(page, SRC("snapchat_hide_suggestions.ts"));
    await openFixture(page, "snapchat/web.html");
    await expect(page.locator("#snap-suggestions")).toBeHidden();
    await expect(page.locator('#chat-main [aria-label="Messages"]')).toBeVisible();
});

test("Snapchat grayscale desaturates media", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, SRC("snapchat_grayscale.ts"));
    await openFixture(page, "snapchat/web.html");
    await expect.poll(() => page.locator("#snap-media").evaluate((el) => getComputedStyle(el).filter))
        .toContain("saturate(0.2)");
});
