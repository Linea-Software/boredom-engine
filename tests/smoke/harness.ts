import { type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { injectScript } from "../../src/common/test-utils.ts";

/**
 * Smoke-test harness for the resistance scripts.
 *
 * Combines the ready-made src/common/test-utils.ts (esbuild in-memory bundling
 * + page.addInitScript injection) with mock fixture pages and intensity setup.
 *
 * Usage pattern (see youtube-grayscale.spec.ts):
 *   1. setIntensity(page, "high")          — sets window.__BOREDOM_INTENSITY__
 *   2. loadScript(page, absPathToSource)   — bundles + injects the script source
 *   3. openFixture(page, "site/name.html") — inlines the mock page
 *   4. assert the expected DOM effect
 */

export type SmokeIntensity = "none" | "low" | "medium" | "high" | "extreme";

// Resolved against the repo root: `bun run test:smoke` runs Playwright from
// the boredom-engine root. (Playwright's TS transform does not preserve
// import.meta.dir, so cwd-relative resolution is the reliable option here.)
export const FIXTURES_DIR = join(process.cwd(), "tests", "smoke", "fixtures");

/**
 * Registers `window.__BOREDOM_INTENSITY__` via an init script so the value is
 * set before any page script (and before the injected resistance script) runs.
 */
export async function setIntensity(page: Page, intensity: SmokeIntensity): Promise<void> {
    await page.addInitScript((value) => {
        (window as unknown as Record<string, unknown>).__BOREDOM_INTENSITY__ = value;
    }, intensity);
}

/**
 * Loads a mock fixture page from `fixtures/<site>/<name>.html`.
 *
 * Uses a real `file://` navigation (NOT page.setContent): page.addInitScript
 * hooks only run on navigation, so setContent would never execute the injected
 * script or the intensity setup. The fixture file itself is still read from
 * disk so each script keeps its own mock page.
 */
export async function openFixture(page: Page, fixturePath: string): Promise<void> {
    const fixturePathAbs = join(FIXTURES_DIR, fixturePath);
    // Fail fast with a clear message when a fixture is missing.
    await readFile(fixturePathAbs, "utf-8");
    await page.goto(pathToFileURL(fixturePathAbs).href, {
        waitUntil: "domcontentloaded",
    });
}

/**
 * Bundles the given script source (resolving the $common alias via
 * tsconfig.json) and injects it before the fixture page's own scripts run.
 */
export async function loadScript(page: Page, scriptSourcePath: string): Promise<void> {
    await injectScript(page, scriptSourcePath);
}
