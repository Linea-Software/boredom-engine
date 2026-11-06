import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { join } from "node:path";

/**
 * ACE Blocker's production path is direct, nonce-bearing <script> tags inserted
 * into the HTML by its MITM proxy (ace-engine/service/proxy/injection.rs).
 * No Tampermonkey bootstrap, @require files or window.__BOREDOM_ENGINE__ API
 * is present here.
 *
 * The fixture also carries the two distinct CSP conditions used by YouTube:
 * a nonce-based strict-dynamic script policy, and Trusted Types enforcement.
 * This verifies that both the site's own scripts and ACE's injected scripts
 * execute when their respective nonces are allowed.
 */
const SRC = (name: string) =>
    join(process.cwd(), "src", "sites", "com", "youtube", name + ".ts");

const SITE_NONCE = "youtube-site-nonce";
const ACE_NONCE = "ace-injection-nonce";
const CSP = [
    "base-uri 'self'",
    "object-src 'none'",
    `script-src 'nonce-${SITE_NONCE}' 'nonce-${ACE_NONCE}' 'strict-dynamic' 'unsafe-inline' https: http:`,
    "require-trusted-types-for 'script'",
].join("; ");

let directBundles: string[];

test.beforeAll(async () => {
    directBundles = await Promise.all(
        ["youtube_shorts_remove", "youtube_grayscale", "youtube_low_quality"].map(
            async (script) => {
                const output = await build({
                    entryPoints: [SRC(script)],
                    bundle: true,
                    format: "iife",
                    platform: "browser",
                    target: "es2020",
                    minify: true,
                    write: false,
                });
                return output.outputFiles[0].text;
            },
        ),
    );
});

function aceDocument(body: string, siteScript = ""): string {
    const makeTag = (nonce: string, code: string) =>
        `<script nonce="${nonce}">${code}</script>`;

    return [
        "<!doctype html><html lang=\"en\"><head>",
        makeTag(SITE_NONCE, `window.__SITE_BOOTSTRAP_RAN__ = true; ${siteScript}`),
        // ACE injects setup before the site-specific scripts.
        makeTag(ACE_NONCE, "window.__BOREDOM_INTENSITY__ = 'high';"),
        ...directBundles.map((bundle) => makeTag(ACE_NONCE, bundle)),
        "</head><body>",
        body,
        "</body></html>",
    ].join("\n");
}

test("ACE direct injection runs YouTube Shorts CSS under CSP without Tampermonkey", async ({ page }) => {
    const html = aceDocument(`
        <ytd-mini-guide-entry-renderer id="shorts">
            <a href="/shorts/" aria-label="Shorts">Shorts</a>
        </ytd-mini-guide-entry-renderer>
        <ytd-mini-guide-entry-renderer id="home">
            <a href="/" aria-label="Home">Home</a>
        </ytd-mini-guide-entry-renderer>
    `);
    await page.route("https://www.youtube.com/**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "text/html",
            headers: { "Content-Security-Policy": CSP },
            body: html,
        }),
    );
    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });

    expect(await page.evaluate(() => (window as any).__SITE_BOOTSTRAP_RAN__)).toBe(true);
    expect(await page.evaluate(() => (window as any).__BOREDOM_INTENSITY__)).toBe("high");
    expect(await page.evaluate(() => (window as any).__BOREDOM_ENGINE__)).toBeUndefined();
    await expect(page.locator("#shorts")).toBeHidden();
    await expect(page.locator("#home")).toBeVisible();
});

test("ACE direct injection applies video grayscale and quality on YouTube watch", async ({ page }) => {
    const html = aceDocument(
        '<div id="movie_player"></div><video id="video-player"></video>',
        `window.__QUALITY_CALLS__ = [];
         document.addEventListener("DOMContentLoaded", () => {
             const player = document.getElementById("movie_player");
             player.setPlaybackQualityRange = (min, max) => window.__QUALITY_CALLS__.push(["range", min, max]);
             player.setPlaybackQuality = (quality) => window.__QUALITY_CALLS__.push(["quality", quality]);
         });`,
    );
    await page.route("https://www.youtube.com/**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "text/html",
            headers: { "Content-Security-Policy": CSP },
            body: html,
        }),
    );
    await page.goto("https://www.youtube.com/watch?v=abc", { waitUntil: "domcontentloaded" });

    await expect.poll(() =>
        page.locator("#video-player").evaluate((element) => getComputedStyle(element).filter),
    ).toContain("grayscale(0.8)");
    await expect.poll(() =>
        page.evaluate(() => (window as any).__QUALITY_CALLS__ as string[][]),
        { timeout: 5_000 },
    ).toContainEqual(["quality", "small"]);
});
