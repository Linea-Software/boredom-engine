import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { loadScript, openFixture, setIntensity } from "./harness";

// Absolute path to the script source; the harness bundles it with esbuild
// (resolving the $common alias via tsconfig.json) and injects it before the
// fixture page's own scripts run. Resolved from the repo root (see harness.ts).
const YOUTUBE_GRAYSCALE_SRC = join(
    process.cwd(),
    "src/sites/com/youtube/youtube_grayscale.ts",
);

test("youtube grayscale desaturates media at high intensity", async ({ page }) => {
    await setIntensity(page, "high");
    await loadScript(page, YOUTUBE_GRAYSCALE_SRC);
    await openFixture(page, "youtube/grayscale.html");

    // applyMediaDesaturation() injects `filter: saturate(var(--boredom-saturate))`
    // on video/img; DESATURATION_MAP[High] = 20%. Chromium serializes the
    // computed percentage as a fraction (saturate(0.2)).
    await expect
        .poll(() =>
            page.locator("#thumbnail").evaluate((el) => getComputedStyle(el).filter),
        )
        .toContain("saturate(0.2)");

    // Non-media elements must stay untouched.
    await expect
        .poll(() =>
            page.locator("#comments").evaluate((el) => getComputedStyle(el).filter),
        )
        .toBe("none");
});
