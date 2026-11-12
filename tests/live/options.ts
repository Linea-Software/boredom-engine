/**
 * Options for the opt-in live-site runner. No site login is automated.
 * URLs and CDP endpoints are intentionally constrained.
 */
export interface LiveOptions {
    site: "youtube" | "reddit";
    script: string;
    headed: boolean;
    cdpUrl?: string;
    profileDir?: string;
    url?: string;
    reportDir?: string;
    timeoutMs: number;
    skipBuild: boolean;
}

export const SITE_ORIGINS = {
    youtube: "https://www.youtube.com",
    reddit: "https://www.reddit.com",
} as const;

// Logged-out YouTube home can have no thumbnail images at all.
export const SCENARIO_ENTRY_URLS: Record<string, string> = {
    youtube_shorts_remove: "https://www.youtube.com/results?search_query=programming",
    youtube_grayscale: "https://www.youtube.com/results?search_query=programming",
};

export const SCENARIOS = {
    youtube_shorts_remove: { site: "youtube", path: "com/youtube/youtube_shorts_remove.js" },
    youtube_grayscale: { site: "youtube", path: "com/youtube/youtube_grayscale.js" },
    reddit_block_recomandations: { site: "reddit", path: "com/reddit/reddit_block_recomandations.js" },
} as const;

export type ScenarioId = keyof typeof SCENARIOS;

export function isScenarioId(id: string): id is ScenarioId {
    return Object.prototype.hasOwnProperty.call(SCENARIOS, id);
}

export function validateSiteUrl(site: LiveOptions["site"], raw: string): string {
    const url = new URL(raw);
    const baseHost = new URL(SITE_ORIGINS[site]).hostname;
    const allowed = url.hostname === baseHost || url.hostname.endsWith("." + baseHost.replace(/^www\./, ""));
    if (url.protocol !== "https:" || url.username || url.password || !allowed || url.port) {
        throw new Error("The target must be an HTTPS URL on the selected public site.");
    }
    return url.href;
}

export function validateCdpUrl(raw: string): string {
    const url = new URL(raw);
    if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
        || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        throw new Error("CDP must use an explicit loopback HTTP endpoint, such as http://127.0.0.1:9222.");
    }
    return url.href;
}

export const USAGE = [
    "Live-site checks are opt-in; browser traffic goes to the real website.",
    "Usage: bun run test:live --site youtube --script youtube_shorts_remove [--headed]",
    "",
    "Options:",
    "  --site youtube|reddit           Target site",
    "  --script ID                     Supported intervention ID",
    "  --headed                        Show the browser",
    "  --url HTTPS_URL                 Override entry URL (same site only)",
    "  --profile-dir PATH              Reuse a dedicated browser profile (never your daily profile)",
    "  --cdp-url http://127.0.0.1:9222 Attach to a dedicated Chrome debug browser",
    "  --report-dir PATH               Local JSON and screenshots directory",
    "  --timeout-ms N                  Per-check timeout (5000-120000, default 30000)",
    "  --skip-build                    Use existing dist/normal bundle (not recommended)",
    "  --help                          Show help",
    "",
    "Available scripts: " + Object.keys(SCENARIOS).join(", "),
].join("\n");

export function parseLiveOptions(argv: string[]): LiveOptions | null {
    if (argv.includes("--help") || argv.includes("-h")) return null;
    const raw: Record<string, string> = {};
    const flags = new Set(["--headed", "--skip-build"]);
    const values = new Set(["--site", "--script", "--cdp-url", "--profile-dir", "--url", "--report-dir", "--timeout-ms"]);
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (flags.has(arg)) {
            if (raw[arg]) throw new Error("Duplicate option: " + arg);
            raw[arg] = "true";
        } else if (values.has(arg)) {
            if (raw[arg] !== undefined) throw new Error("Duplicate option: " + arg);
            const val = argv[++i];
            if (!val || val.startsWith("--")) throw new Error("Missing value for " + arg);
            raw[arg] = val;
        } else {
            throw new Error("Unknown argument: " + arg);
        }
    }
    const site = raw["--site"];
    const script = raw["--script"];
    if (site !== "youtube" && site !== "reddit") throw new Error("Specify --site youtube or --site reddit.");
    if (!script || !isScenarioId(script)) {
        throw new Error("No live assertions exist for that intervention. Available: " + Object.keys(SCENARIOS).join(", "));
    }
    if (SCENARIOS[script].site !== site) throw new Error("Script " + script + " does not belong to " + site);
    const timeoutMs = raw["--timeout-ms"] === undefined ? 30000 : Number(raw["--timeout-ms"]);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 5000 || timeoutMs > 120000) {
        throw new Error("--timeout-ms must be an integer from 5000 to 120000.");
    }
    const cdpUrl = raw["--cdp-url"] ? validateCdpUrl(raw["--cdp-url"]) : undefined;
    if (cdpUrl && raw["--profile-dir"]) throw new Error("Use either --cdp-url or --profile-dir, not both.");
    return {
        site, script, headed: raw["--headed"] === "true",
        cdpUrl, profileDir: raw["--profile-dir"],
        url: raw["--url"] ? validateSiteUrl(site, raw["--url"]) : undefined,
        reportDir: raw["--report-dir"],
        timeoutMs, skipBuild: raw["--skip-build"] === "true",
    };
}
