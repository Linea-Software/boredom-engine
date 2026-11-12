import type { Page } from "@playwright/test";
import type { LiveOptions, ScenarioId } from "./options.ts";

export type Outcome = "passed" | "failed" | "inconclusive";
export interface LiveCheck {
    name: string;
    status: Outcome;
    detail: string;
}

const SHORTS_SURFACES = [
    'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])',
    'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
    'ytd-video-renderer:has(a[href^="/shorts/"])',
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'yt-lockup-view-model:has(a[href^="/shorts/"])',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
].join(", ");

async function visibleCount(page: Page, selector: string): Promise<number> {
    return page.locator(selector).evaluateAll((nodes) =>
        nodes.filter((node) => {
            const el = node as HTMLElement;
            const style = getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden"
                && style.visibility !== "collapse" && Number(style.opacity) !== 0
                && el.getClientRects().length > 0;
        }).length,
    );
}

async function waitForVisible(page: Page, selector: string, timeoutMs: number): Promise<boolean> {
    try {
        await page.locator(selector).filter({ visible: true }).first().waitFor({
            state: "visible",
            timeout: Math.min(timeoutMs, 10000),
        });
        return true;
    } catch {
        return false;
    }
}

function result(name: string, status: Outcome, detail: string): LiveCheck {
    return { name, status, detail };
}

async function checkHiddenComparedToBaseline(
    baseline: Page,
    treated: Page,
    selector: string,
    name: string,
    timeoutMs: number,
): Promise<LiveCheck> {
    const present = await waitForVisible(baseline, selector, timeoutMs);
    if (!present) {
        return result(name, "inconclusive", "The baseline site did not expose a visible matching target.");
    }
    const before = await visibleCount(baseline, selector);
    // Confirm that the treated page contains the target before checking CSS.
    try {
        await treated.locator(selector).first().waitFor({
            state: "attached", timeout: Math.min(timeoutMs, 10000),
        });
    } catch {
        return result(name, "inconclusive", "Target was absent on the script-enabled page.");
    }
    // Allow real SPAs to finish inserting late-arriving nodes.
    try {
        await treated.waitForFunction((css) => {
            const nodes = document.querySelectorAll(css);
            return [...nodes].every((node) => {
                const el = node as HTMLElement;
                const style = getComputedStyle(el);
                return style.display === "none" || style.visibility === "hidden"
                    || el.getClientRects().length === 0;
            });
        }, selector, { timeout: Math.min(timeoutMs, 10000) });
    } catch {
        // We report the observed result below.
    }
    const after = await visibleCount(treated, selector);
    return result(name, after === 0 ? "passed" : "failed",
        "Visible targets: baseline=" + before + ", script-enabled=" + after);
}

async function checkUnaffectedNavigation(baseline: Page, treated: Page): Promise<LiveCheck> {
    const selector = 'a[href="/"], a[aria-label="Home"], ytd-logo a, header a';
    const before = await visibleCount(baseline, selector);
    if (!before) return result("Primary navigation still usable", "inconclusive",
        "No visible navigation link was found on the baseline page.");
    const after = await visibleCount(treated, selector);
    return result("Primary navigation still usable", after > 0 ? "passed" : "failed",
        "Visible navigation links: baseline=" + before + ", script-enabled=" + after);
}

async function verifyYouTubeShorts(baseline: Page, treated: Page, timeoutMs: number): Promise<LiveCheck[]> {
    const checks = [
        await checkHiddenComparedToBaseline(
            baseline, treated, SHORTS_SURFACES, "Shorts surfaces hidden on live home", timeoutMs,
        ),
        await checkUnaffectedNavigation(baseline, treated),
    ];
    // This tests a real navigation to the Shorts route. It must redirect to /.
    // It does not require the video identifier to exist.
    try {
        await treated.goto("https://www.youtube.com/shorts/abcdefghijk", {
            waitUntil: "commit", timeout: timeoutMs,
        }).catch(() => undefined); // A script redirect can abort the first navigation.
        await treated.waitForURL((url) => url.hostname.endsWith("youtube.com") && url.pathname === "/", {
            timeout: Math.min(timeoutMs, 12000),
        });
        checks.push(result("Direct Shorts route redirects home", "passed", "Navigation ended on /."));
    } catch {
        checks.push(result("Direct Shorts route redirects home", "failed",
            "The browser did not arrive at the YouTube home route."));
    }
    return checks;
}

async function verifyYouTubeGrayscale(baseline: Page, treated: Page, timeoutMs: number): Promise<LiveCheck[]> {
    const hasImage = await waitForVisible(baseline, "img", timeoutMs);
    if (!hasImage) return [result("Media desaturation", "inconclusive",
        "No visible images were found on the real baseline page.")];
    const hasTreatedImage = await waitForVisible(treated, "img", timeoutMs);
    if (!hasTreatedImage) return [result("Media desaturation", "inconclusive",
        "No visible images were found after script injection.")];
    const outcome = await treated.locator("img:visible").first().evaluate((el) => ({
        filter: getComputedStyle(el).filter,
        saturation: getComputedStyle(document.documentElement).getPropertyValue("--boredom-saturate").trim(),
    }));
    const enabled = outcome.saturation === "0%" && /saturate\(0(?:%|)\)/.test(outcome.filter);
    return [result("Live image is desaturated", enabled ? "passed" : "failed",
        "Computed filter=" + outcome.filter + "; --boredom-saturate=" + outcome.saturation)];
}

async function verifyRedditRecommendations(
    baseline: Page, treated: Page, timeoutMs: number,
): Promise<LiveCheck[]> {
    const blocked = await baseline.getByText(/blocked by network security/i).count() > 0;
    if (blocked) {
        return [result("Reddit website access", "inconclusive",
            "Reddit blocked the browser at its network security layer; no intervention claim was tested.")];
    }
    const checks = [await checkHiddenComparedToBaseline(
        baseline, treated, "shreddit-feed", "Homepage recommendation feed hidden", timeoutMs,
    )];
    checks.push(await checkUnaffectedNavigation(baseline, treated));
    return checks;
}

export async function verifyLiveScenario(
    id: ScenarioId, baseline: Page, treated: Page, options: LiveOptions,
): Promise<LiveCheck[]> {
    switch (id) {
        case "youtube_shorts_remove":
            return verifyYouTubeShorts(baseline, treated, options.timeoutMs);
        case "youtube_grayscale":
            return verifyYouTubeGrayscale(baseline, treated, options.timeoutMs);
        case "reddit_block_recomandations":
            return verifyRedditRecommendations(baseline, treated, options.timeoutMs);
    }
}
