import { describe, expect, test } from "bun:test";
import {
    CATALOG_SCHEMA_VERSION,
    type Catalog,
    type SiteNode,
} from "../../scripts/catalog-contract.ts";
import {
    generateBootstrapScript,
    generateUserscript,
    reverseDomainToHost,
    wrapScript,
} from "../../scripts/adapters/tampermonkey.ts";

function makeCatalog(sites: Record<string, SiteNode>): Catalog {
    return {
        schemaVersion: CATALOG_SCHEMA_VERSION,
        projectName: "boredom-engine",
        license: "MIT",
        sites,
    };
}

function node(
    scripts: Record<string, unknown>[] = [],
    children: Record<string, SiteNode> = {},
): SiteNode {
    return { scripts: scripts as never, children };
}

function script(overrides: Record<string, unknown> = {}) {
    return {
        id: "script",
        path: "com/youtube/script.js",
        name: "Script",
        description: "A test script.",
        version: "1.0.0",
        ...overrides,
    };
}

const sampleCatalog = makeCatalog({
    com: node([], {
        youtube: node([
            script({ id: "youtube_grayscale", name: "YouTube Grayscale", path: "com/youtube/youtube_grayscale.js" }),
            script({ id: "youtube_audio_delay", name: "YouTube Audio Delay", path: "com/youtube/youtube_audio_delay.js" }),
        ]),
    }),
    tv: node([], {
        twitch: node([script({ id: "twitch_grayscale", name: "Twitch Grayscale", path: "tv/twitch/twitch_grayscale.js" })]),
    }),
});

/** A fake element that supports everything the menu touches. */
function makeElement() {
    return {
        src: undefined as string | undefined,
        textContent: "",
        title: "",
        className: "",
        type: "",
        checked: false,
        style: {},
        setAttribute: () => {},
        addEventListener: () => {},
        appendChild: () => {},
        querySelectorAll: () => [] as unknown[],
        classList: {
            toggle: () => {},
            add: () => {},
            remove: () => {},
        },
    };
}

/** Executes a generated artifact in a minimal fake DOM. */
function runScript(
    source: string,
    hostname: string,
): { win: Record<string, any> } {
    const fakeDocument: Record<string, unknown> = {
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        documentElement: { appendChild: () => {} },
        createElement: () => makeElement(),
        createTextNode: () => ({ nodeValue: "" }),
    };
    const win: Record<string, any> = { location: { hostname, reload: () => {} } };
    const fn = new Function(
        "document",
        "window",
        "location",
        "setTimeout",
        "console",
        source,
    );
    fn(fakeDocument, win, win.location, (cb: () => void) => cb(), console);
    return { win };
}

describe("reverseDomainToHost", () => {
    test("reverses domain labels into a host", () => {
        expect(reverseDomainToHost(["com", "youtube"])).toBe("youtube.com");
        expect(reverseDomainToHost(["tv", "twitch"])).toBe("twitch.tv");
    });
});

describe("wrapScript", () => {
    const wrapped = wrapScript("window.__RAN__ = true;", "youtube_grayscale", "com/youtube");

    test("wraps with a site + enabled guard", () => {
        expect(wrapped).toContain('window.__BOREDOM_STATE__.currentSite === "com/youtube"');
        expect(wrapped).toContain('window.__BOREDOM_STATE__.enabled["youtube_grayscale"] !== false');
        expect(wrapped).toContain("window.__RAN__ = true;");
    });

    test("runs the original when the site matches and the script is enabled", () => {
        const win = { __BOREDOM_STATE__: { currentSite: "com/youtube", enabled: {} } };
        new Function("window", wrapped)(win);
        expect((win as Record<string, unknown>).__RAN__).toBe(true);
    });

    test("skips the script on a different site", () => {
        const win = { __BOREDOM_STATE__: { currentSite: "com/facebook", enabled: {} } };
        new Function("window", wrapped)(win);
        expect((win as Record<string, unknown>).__RAN__).toBeUndefined();
    });

    test("skips the script when disabled", () => {
        const win = {
            __BOREDOM_STATE__: { currentSite: "com/youtube", enabled: { youtube_grayscale: false } },
        };
        new Function("window", wrapped)(win);
        expect((win as Record<string, unknown>).__RAN__).toBeUndefined();
    });
});

describe("generateBootstrapScript", () => {
    test("publishes state and the control API before site scripts run", () => {
        const source = generateBootstrapScript(sampleCatalog);
        const { win } = runScript(source, "www.youtube.com");

        expect(win.__BOREDOM_STATE__.currentSite).toBe("com/youtube");
        expect(win.__BOREDOM_INTENSITY__).toBe("medium");

        const api = win.__BOREDOM_ENGINE__;
        expect(typeof api.getState).toBe("function");
        expect(api.getScripts().map((s: { id: string }) => s.id)).toEqual([
            "youtube_grayscale",
            "youtube_audio_delay",
        ]);
        expect(api.getScripts().every((s: { enabled: boolean }) => s.enabled)).toBe(true);
    });

    test("setIntensity applies live and persists", () => {
        const source = generateBootstrapScript(sampleCatalog);
        const { win } = runScript(source, "youtube.com");

        const api = win.__BOREDOM_ENGINE__;
        expect(api.getState().intensity).toBe("medium");
        const next = api.setIntensity("extreme");
        expect(next.intensity).toBe("extreme");
        expect(win.__BOREDOM_INTENSITY__).toBe("extreme");
        expect(api.getState().intensity).toBe("extreme");
        expect(() => api.setIntensity("insane")).toThrow(/Invalid intensity/);
    });

    test("setIntensity emits a browser event for live site-script updates", () => {
        const { win } = runScript(generateBootstrapScript(sampleCatalog), "youtube.com");
        const events: string[] = [];
        win.dispatchEvent = (event: Event) => events.push(event.type);
        win.__BOREDOM_ENGINE__.setIntensity("high");
        expect(events).toEqual(["boredom-engine:intensitychange"]);
    });

    test("enable/disable toggles persist per script id", () => {
        const source = generateBootstrapScript(sampleCatalog);
        const { win } = runScript(source, "www.youtube.com");

        const api = win.__BOREDOM_ENGINE__;
        api.disableScript("youtube_grayscale");
        const after = api.getScripts();
        expect(after.find((s: { id: string }) => s.id === "youtube_grayscale").enabled).toBe(false);
        expect(after.find((s: { id: string }) => s.id === "youtube_audio_delay").enabled).toBe(true);
        api.enableScript("youtube_grayscale");
        expect(api.getScripts().every((s: { enabled: boolean }) => s.enabled)).toBe(true);
    });

    test("reports no site/scripts for unsupported hosts", () => {
        const source = generateBootstrapScript(sampleCatalog);
        const { win } = runScript(source, "unsupported.example");
        expect(win.__BOREDOM_STATE__.currentSite).toBeNull();
        expect(win.__BOREDOM_ENGINE__.getScripts()).toEqual([]);
    });
});

describe("generateUserscript", () => {
    const files = {
        bootstrapUrl: "file:///C:/proj/dist/tampermonkey/bootstrap.js",
        scriptUrls: [
            "file:///C:/proj/dist/tampermonkey/scripts/com/youtube/youtube_grayscale.js",
            "file:///C:/proj/dist/tampermonkey/scripts/com/youtube/youtube_audio_delay.js",
            "file:///C:/proj/dist/tampermonkey/scripts/tv/twitch/twitch_grayscale.js",
        ],
    };
    const source = generateUserscript(sampleCatalog, files);

    test("emits a complete userscript header", () => {
        expect(source).toContain("==UserScript==");
        expect(source).toContain("==/UserScript==");
        expect(source).toContain("// @noframes");
        expect(source).toContain("// @run-at       document-start");
        expect(source).toContain("// @grant        none");
        expect(source).toContain("// @version      3.0.0");
        expect(source).toContain("// @namespace    boredom-engine");
    });

    test("emits @match for bare and wildcard subdomain of every covered host", () => {
        expect(source).toContain("// @match        *://youtube.com/*");
        expect(source).toContain("// @match        *://*.youtube.com/*");
        expect(source).toContain("// @match        *://twitch.tv/*");
        expect(source).toContain("// @match        *://*.twitch.tv/*");
        expect(source.split("\n").filter((line) => line.startsWith("// //"))).toEqual([]);
        expect(source).not.toContain("example.com");
    });

    test("requires the bootstrap first, then every wrapped site script", () => {
        const requireLines = source
            .split("\n")
            .filter((line) => line.startsWith("// @require"))
            .map((line) => line.replace(/^\/\/ @require\s+/, ""));
        expect(requireLines[0]).toBe(files.bootstrapUrl);
        for (const url of files.scriptUrls) {
            expect(requireLines).toContain(url);
        }
    });

    test("throws when the catalog has no resistance scripts", () => {
        expect(() => generateUserscript(makeCatalog({}), files)).toThrow(
            /no resistance scripts/,
        );
    });
});
