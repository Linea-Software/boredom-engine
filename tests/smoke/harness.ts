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

/**
 * Serves a fixture over a fake `http://boredom-fixture.test` origin instead of
 * `file://`. Some scripts branch on `window.location.pathname`/`href` (e.g.
 * Reddit recommendations only run on `/`, YouTube low-quality on `/watch`),
 * which can never match a Windows `file://` path — serving over HTTP lets the
 * test control the URL exactly. No real network is involved: the request is
 * fulfilled in-process from the fixture file.
 */
export async function openFixtureAt(
    page: Page,
    fixturePath: string,
    url = "http://boredom-fixture.test/",
): Promise<void> {
    const fixturePathAbs = join(FIXTURES_DIR, fixturePath);
    // Fail fast with a clear message when a fixture is missing.
    const html = await readFile(fixturePathAbs, "utf-8");
    await page.route("http://boredom-fixture.test/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: html }),
    );
    await page.goto(url, { waitUntil: "domcontentloaded" });
}

/**
 * Pins `Math.random` to a fixed value (default 0) so probabilistic effects
 * (buffering delays, captcha jitter) become deterministic: 0 makes every
 * chance roll succeed on the first check.
 */
export async function stubMathRandom(page: Page, value = 0): Promise<void> {
    await page.addInitScript((v) => {
        Math.random = () => v;
    }, value);
}

/**
 * Configures the boredom server globals and records `window.fetch` calls
 * instead of performing real network requests. Lets tracking scripts
 * (`@type usage`) be smoke-tested: their only observable effect is the
 * report they POST to the local server.
 */
export async function stubUsageReporting(page: Page): Promise<void> {
    await page.addInitScript(() => {
        (window as unknown as Record<string, unknown>).__BOREDOM_SERVER_PORT__ = "12345";
        (window as unknown as Record<string, unknown>).__BOREDOM_SERVER_HOSTNAME__ = "127.0.0.1";
        const calls: Array<{ url: string; body: string | null }> = [];
        (window as unknown as Record<string, unknown>).__FETCH_CALLS__ = calls;
        (window as unknown as Record<string, unknown>).fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit,
        ): Promise<Response> => {
            calls.push({
                url: String(input),
                body: typeof init?.body === "string" ? init.body : null,
            });
            return { ok: true, status: 200, json: async () => ({}) } as Response;
        };
    });
}

/**
 * Replaces `history.replaceState` with a recording no-op. Captcha scripts
 * spoof the URL via replaceState, which throws a SecurityError on `file://`
 * pages (opaque origin). Recording the calls still lets tests assert the
 * spoofing logic without depending on the file:// restriction.
 */
export async function stubReplaceState(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const calls: Array<{ title: string; url: string | null }> = [];
        (window as unknown as Record<string, unknown>).__REPLACE_STATE_CALLS__ = calls;
        history.replaceState = (state: unknown, title: string, url?: string | URL | null) => {
            calls.push({ title, url: url === null || url === undefined ? null : String(url) });
            void state;
        };
    });
}

/**
 * Stubs the Web Audio API so audio-delay scripts can run headless and their
 * delay wiring can be asserted (delayTime value on the created DelayNode).
 */
export async function stubAudioContext(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const rec: {
            sources: unknown[];
            delays: Array<{ maxDelay: number; node: { delayTime: { value: number }; connect: () => void } }>;
        } = {
            sources: [],
            delays: [],
        };
        (window as unknown as Record<string, unknown>).__AUDIO_STUB__ = rec;
        (window as unknown as Record<string, unknown>).AudioContext = class {
            state = "running";
            destination = {};
            resume(): Promise<void> {
                this.state = "running";
                return Promise.resolve();
            }
            createMediaElementSource(element: HTMLMediaElement): { connect: () => void } {
                rec.sources.push(element);
                return { connect() {} };
            }
            createDelay(maxDelay: number): { delayTime: { value: number }; connect: () => void } {
                const node = { delayTime: { value: 0 }, connect() {} };
                rec.delays.push({ maxDelay, node });
                return node;
            }
        };
    });
}
