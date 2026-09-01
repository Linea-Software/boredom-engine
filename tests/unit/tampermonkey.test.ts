import { describe, expect, test } from "bun:test";
import {
    CATALOG_SCHEMA_VERSION,
    type Catalog,
    type SiteNode,
} from "../../scripts/catalog-contract.ts";
import {
    generateTampermonkeyScript,
    reverseDomainToHost,
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

/** A fake element that supports everything the generated menu touches. */
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

interface FakeWindow {
    location: { hostname: string; reload: () => void };
    __BOREDOM_INTENSITY__?: string;
    __BOREDOM_ENGINE__?: Record<string, unknown>;
}

/**
 * Executes the generated userscript body in a minimal fake DOM and returns the
 * `src` values of the script elements appended to <head>. `setTimeout` runs
 * callbacks immediately, so `document.head`/`document.body` being present means
 * one inject + menu pass.
 */
function runInjected(scriptSource: string, hostname: string): { appended: string[]; win: FakeWindow } {
    const appended: string[] = [];
    const fakeDocument: Record<string, unknown> = {
        head: {
            appendChild: (el: { src?: string }) => {
                if (el && el.src) appended.push(el.src);
            },
        },
        body: { appendChild: () => {} },
        documentElement: { appendChild: () => {} },
        createElement: () => makeElement(),
        createTextNode: () => ({ nodeValue: "" }),
    };
    const fakeWindow: FakeWindow = {
        location: { hostname, reload: () => {} },
    };
    const fn = new Function(
        "document",
        "window",
        "location",
        "setTimeout",
        "console",
        scriptSource,
    );
    fn(fakeDocument, fakeWindow, fakeWindow.location, (cb: () => void) => cb(), console);
    return { appended, win: fakeWindow };
}

describe("reverseDomainToHost", () => {
    test("reverses domain labels into a host", () => {
        expect(reverseDomainToHost(["com", "youtube"])).toBe("youtube.com");
        expect(reverseDomainToHost(["tv", "twitch"])).toBe("twitch.tv");
    });
});

describe("generateTampermonkeyScript", () => {
    test("emits a complete userscript header", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        expect(source).toContain("==UserScript==");
        expect(source).toContain("==/UserScript==");
        expect(source).toContain("// @noframes");
        expect(source).toContain("// @run-at       document-start");
        expect(source).toContain("// @grant        none");
        expect(source).toContain("// @version      2.0.0");
        expect(source).toContain("// @namespace    boredom-engine");
    });

    test("emits @match for bare and wildcard subdomain of every covered host", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        expect(source).toContain("// @match        *://youtube.com/*");
        expect(source).toContain("// @match        *://*.youtube.com/*");
        expect(source).toContain("// @match        *://twitch.tv/*");
        expect(source).toContain("// @match        *://*.twitch.tv/*");
        // No doubled comment prefixes that Tampermonkey would mis-parse.
        expect(source.split("\n").filter((line) => line.startsWith("// //"))).toEqual([]);
        // Only catalog hosts are matched.
        expect(source).not.toContain("example.com");
    });

    test("embeds every catalog script with id, name and path", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        expect(source).toContain('"id":"youtube_grayscale","name":"YouTube Grayscale","path":"normal/com/youtube/youtube_grayscale.js"');
        expect(source).toContain('"id":"youtube_audio_delay","name":"YouTube Audio Delay","path":"normal/com/youtube/youtube_audio_delay.js"');
        expect(source).toContain('"id":"twitch_grayscale","name":"Twitch Grayscale","path":"normal/tv/twitch/twitch_grayscale.js"');
    });

    test("injects only the current host's scripts (all enabled by default)", () => {
        const source = generateTampermonkeyScript(sampleCatalog);

        const youtube = runInjected(source, "www.youtube.com");
        expect(youtube.appended).toEqual([
            "http://localhost:48325/normal/com/youtube/youtube_grayscale.js",
            "http://localhost:48325/normal/com/youtube/youtube_audio_delay.js",
        ]);

        // Subdomains resolve through the reverse-domain walk, like the engine.
        expect(runInjected(source, "m.youtube.com").appended).toEqual(youtube.appended);

        const twitch = runInjected(source, "twitch.tv");
        expect(twitch.appended).toEqual([
            "http://localhost:48325/normal/tv/twitch/twitch_grayscale.js",
        ]);

        expect(runInjected(source, "unsupported.example").appended).toEqual([]);
    });

    test("exposes the window.__BOREDOM_ENGINE__ control API", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        const { win } = runInjected(source, "www.youtube.com");

        const api = win.__BOREDOM_ENGINE__ as Record<string, unknown>;
        expect(api).toBeDefined();
        for (const method of [
            "getState",
            "getScripts",
            "setIntensity",
            "enableScript",
            "disableScript",
            "toggleScript",
            "reload",
        ]) {
            expect(typeof api[method], `api.${method} should be a function`).toBe("function");
        }
    });

    test("setIntensity applies live and persists", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        const { win } = runInjected(source, "www.youtube.com");

        const api = win.__BOREDOM_ENGINE__ as {
            setIntensity: (v: string) => { intensity: string };
            getState: () => { intensity: string; enabled: Record<string, boolean> };
        };
        expect(api.getState().intensity).toBe("medium");
        const next = api.setIntensity("high");
        expect(next.intensity).toBe("high");
        expect(win.__BOREDOM_INTENSITY__).toBe("high");
        expect(api.getState().intensity).toBe("high");

        expect(() => api.setIntensity("insane")).toThrow(/Invalid intensity/);
    });

    test("enable/disable toggles persist per script id", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        const { win } = runInjected(source, "www.youtube.com");

        const api = win.__BOREDOM_ENGINE__ as {
            getScripts: () => { id: string; enabled: boolean }[];
            disableScript: (id: string) => unknown;
            enableScript: (id: string) => unknown;
        };
        expect(api.getScripts().map((s) => s.id)).toEqual(["youtube_grayscale", "youtube_audio_delay"]);
        expect(api.getScripts().every((s) => s.enabled)).toBe(true);

        api.disableScript("youtube_grayscale");
        const after = api.getScripts();
        expect(after.find((s) => s.id === "youtube_grayscale")?.enabled).toBe(false);
        expect(after.find((s) => s.id === "youtube_audio_delay")?.enabled).toBe(true);

        api.enableScript("youtube_grayscale");
        expect(api.getScripts().every((s) => s.enabled)).toBe(true);
    });

    test("throws when the catalog has no resistance scripts", () => {
        expect(() => generateTampermonkeyScript(makeCatalog({}))).toThrow(
            /no resistance scripts/,
        );
    });
});
