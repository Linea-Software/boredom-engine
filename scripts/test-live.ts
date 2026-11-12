/**
 * Opt-in test of production IIFE bundles on real third-party pages.
 *
 * The baseline page and injected page share a dedicated browser context, but
 * only the injected page receives the script. No external mutations or login
 * flows are automated. A missing test target is inconclusive, never a pass.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
    parseLiveOptions, SCENARIOS, SCENARIO_ENTRY_URLS, SITE_ORIGINS, USAGE,
    type LiveOptions, type ScenarioId,
} from "../tests/live/options.ts";
import { verifyLiveScenario, type LiveCheck, type Outcome } from "../tests/live/scenarios.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface CatalogEntry { id: string; path: string; }
interface CatalogNode { scripts: CatalogEntry[]; children: Record<string, CatalogNode>; }
interface Catalog { sites: Record<string, CatalogNode>; }
interface LiveReport {
    site: string;
    script: string;
    timestamp: string;
    status: Outcome | "error";
    checks: LiveCheck[];
    browserMode: string;
    httpStatuses: { baseline?: number; treated?: number };
    browserErrors: { console: number; page: number; requests: number };
    screenshots: string[];
    consentRejected: boolean;
    error?: string;
}

function findScript(node: CatalogNode, id: string): CatalogEntry | undefined {
    const own = node.scripts.find((entry) => entry.id === id);
    if (own) return own;
    for (const child of Object.values(node.children)) {
        const result = findScript(child, id);
        if (result) return result;
    }
    return undefined;
}

async function getProductionBundle(id: ScenarioId): Promise<string> {
    const catalog = JSON.parse(await readFile(join(ROOT, "dist/scripts-data.json"), "utf8")) as Catalog;
    const match = Object.values(catalog.sites).map((node) => findScript(node, id)).find(Boolean);
    if (!match || match.path !== SCENARIOS[id].path) {
        throw new Error("Production catalog entry missing or mismatched for " + id);
    }
    return readFile(join(ROOT, "dist/normal", match.path), "utf8");
}

async function buildProductionBundle(): Promise<void> {
    const subprocess = Bun.spawn(["bun", "run", "build"], { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
    if ((await subprocess.exited) !== 0) throw new Error("Production bundle build failed.");
}

interface Session {
    context: BrowserContext;
    close: () => Promise<void>;
    mode: string;
}

async function openSession(options: LiveOptions): Promise<Session> {
    if (options.cdpUrl) {
        const browser: Browser = await chromium.connectOverCDP(options.cdpUrl);
        // An explicit CDP connection is allowed only to a dedicated test profile.
        // Closing our pages must not close preexisting user tabs.
        const context = browser.contexts()[0];
        if (!context) {
            await browser.close();
            throw new Error("CDP browser exposes no default context.");
        }
        return { context, close: () => browser.close(), mode: "cdp" };
    }

    const ephemeral = !options.profileDir;
    const dir = ephemeral
        ? await mkdtemp(join(tmpdir(), "boredom-live-"))
        : resolve(options.profileDir!);
    try {
        const context = await chromium.launchPersistentContext(dir, {
            headless: !options.headed,
            viewport: { width: 1365, height: 900 },
            acceptDownloads: false,
            serviceWorkers: "allow",
        });
        return {
            context, mode: ephemeral ? "isolated-temporary-profile" : "isolated-reusable-profile",
            close: async () => {
                await context.close();
                if (ephemeral) await rm(dir, { recursive: true, force: true });
            },
        };
    } catch (error) {
        if (ephemeral) await rm(dir, { recursive: true, force: true });
        throw error;
    }
}

function watchPage(page: Page, report: LiveReport): void {
    page.on("console", (msg) => {
        if (msg.type() === "error") report.browserErrors.console++;
    });
    page.on("pageerror", () => report.browserErrors.page++);
    page.on("requestfailed", () => report.browserErrors.requests++);
}

function failureDescription(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    // Avoid copying query strings, tokens, and full URLs to artifact reports.
    return message.replace(/https?:\/\/\S+/g, "[redacted-url]").slice(0, 500);
}

function finalStatus(checks: LiveCheck[]): Outcome {
    if (checks.some((check) => check.status === "failed")) return "failed";
    if (checks.length === 0 || checks.some((check) => check.status === "inconclusive")) return "inconclusive";
    return "passed";
}

async function rejectOptionalCookies(page: Page): Promise<boolean> {
    // Consent is not an access challenge. Choose the privacy-preserving option
    // for the disposable test profile, but never accept optional cookies.
    // YouTube gives this button a long aria-label that differs from its visible
    // label. Match the visible text, not the accessibility name.
    const reject = page.locator("button").filter({
        hasText: /^(Reject all|Rifiuta tutto|Alle ablehnen|Tout refuser|Rechazar todo)$/i,
    }).first();
    try {
        await reject.waitFor({ state: "visible", timeout: 10000 });
        await reject.click({ timeout: 5000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 7000 }).catch(() => undefined);
        return true;
    } catch {
        return false;
    }
}

async function visit(page: Page, url: string, timeoutMs: number): Promise<number | undefined> {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const status = response?.status();
    if (status && status >= 400) throw new Error("Website returned HTTP " + status);
    return status;
}

async function saveScreen(page: Page, dir: string, name: string, report: LiveReport): Promise<void> {
    const path = join(dir, name);
    await page.screenshot({ path, fullPage: false, timeout: 15000, animations: "disabled" });
    report.screenshots.push(name);
}

async function run(options: LiveOptions): Promise<number> {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folder = options.reportDir
        ? resolve(options.reportDir) : join(ROOT, "test-results/live", options.script + "-" + stamp);
    await mkdir(folder, { recursive: true });
    const report: LiveReport = {
        site: options.site, script: options.script, timestamp: new Date().toISOString(),
        status: "error", checks: [], browserMode: "not-started",
        httpStatuses: {}, browserErrors: { console: 0, page: 0, requests: 0 },
        screenshots: [], consentRejected: false,
    };
    let session: Session | undefined;
    let baseline: Page | undefined;
    let treated: Page | undefined;
    try {
        if (!options.skipBuild) await buildProductionBundle();
        const bundle = await getProductionBundle(options.script as ScenarioId);
        session = await openSession(options);
        report.browserMode = session.mode;

        baseline = await session.context.newPage();
        watchPage(baseline, report);
        baseline.setDefaultTimeout(options.timeoutMs);
        const entryUrl = options.url ?? SCENARIO_ENTRY_URLS[options.script] ?? SITE_ORIGINS[options.site];
        report.httpStatuses.baseline = await visit(baseline, entryUrl, options.timeoutMs);
        if (options.site === "youtube") {
            report.consentRejected = await rejectOptionalCookies(baseline);
        }

        treated = await session.context.newPage();
        watchPage(treated, report);
        treated.setDefaultTimeout(options.timeoutMs);
        // Page-scoped injection: the baseline and other tabs remain untouched.
        await treated.addInitScript({ content: bundle });
        report.httpStatuses.treated = await visit(treated, entryUrl, options.timeoutMs);

        // Local screenshots can contain account data. They never leave this host.
        await saveScreen(baseline, folder, "baseline.png", report);
        await saveScreen(treated, folder, "script-enabled.png", report);

        report.checks = await verifyLiveScenario(options.script as ScenarioId, baseline, treated, options);
        report.status = finalStatus(report.checks);
    } catch (error) {
        report.error = failureDescription(error);
        // External connectivity, login walls and browser startup errors are not
        // proof of a broken intervention.
        report.status = report.browserMode === "not-started" ? "error" : "inconclusive";
    } finally {
        try { await baseline?.close(); } catch { /* session could have ended */ }
        try { await treated?.close(); } catch { /* session could have ended */ }
        try { await session?.close(); } catch (error) {
            report.error ??= "Browser shutdown: " + failureDescription(error);
            if (report.status === "passed") report.status = "error";
        }
        await writeFile(join(folder, "report.json"), JSON.stringify(report, null, 2) + "\n");
    }

    console.log("\nLive-site test: " + report.script + " → " + report.status.toUpperCase());
    for (const check of report.checks) {
        console.log("  [" + check.status.toUpperCase() + "] " + check.name + ": " + check.detail);
    }
    if (report.error) console.error("  " + report.error);
    console.log("  Report: " + join(folder, "report.json"));
    return report.status === "passed" ? 0 : report.status === "inconclusive" ? 2 : 1;
}

try {
    const options = parseLiveOptions(Bun.argv.slice(2));
    if (!options) {
        console.log(USAGE);
    } else {
        process.exitCode = await run(options);
    }
} catch (error) {
    console.error(failureDescription(error));
    console.error(USAGE);
    process.exitCode = 1;
}
