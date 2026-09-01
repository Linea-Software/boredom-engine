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
            script({ id: "youtube_grayscale", path: "com/youtube/youtube_grayscale.js" }),
            script({ id: "youtube_audio_delay", path: "com/youtube/youtube_audio_delay.js" }),
        ]),
    }),
    tv: node([], {
        twitch: node([script({ id: "twitch_grayscale", path: "tv/twitch/twitch_grayscale.js" })]),
    }),
});

/**
 * Executes the generated userscript body in a minimal fake DOM and returns the
 * `src` values of the script elements it appended. `setTimeout` runs callbacks
 * immediately, so `document.head` being present means one inject pass.
 */
function runInjected(scriptSource: string, hostname: string): string[] {
    const appended: string[] = [];
    const fakeElement = { src: "", setAttribute: () => {}, };
    const fakeDocument = {
        head: { appendChild: (el: { src: string }) => appended.push(el.src) },
        createElement: () => ({ ...fakeElement }),
    };
    const fakeWindow: Record<string, unknown> = { location: { hostname } };
    const fn = new Function(
        "document",
        "window",
        "location",
        "setTimeout",
        "console",
        scriptSource,
    );
    fn(fakeDocument, fakeWindow, fakeWindow.location, (cb: () => void) => cb(), console);
    return appended;
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
        expect(source).toContain("// @version      1.0.0");
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

    test("embeds every catalog script path with a normal/ prefix", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        expect(source).toContain('"normal/com/youtube/youtube_grayscale.js"');
        expect(source).toContain('"normal/com/youtube/youtube_audio_delay.js"');
        expect(source).toContain('"normal/tv/twitch/twitch_grayscale.js"');
    });

    test("injects only the current host's scripts", () => {
        const source = generateTampermonkeyScript(sampleCatalog);

        const youtube = runInjected(source, "www.youtube.com");
        expect(youtube).toEqual([
            "http://localhost:48325/normal/com/youtube/youtube_grayscale.js",
            "http://localhost:48325/normal/com/youtube/youtube_audio_delay.js",
        ]);

        // Subdomains resolve through the reverse-domain walk, like the engine.
        const mobileYoutube = runInjected(source, "m.youtube.com");
        expect(mobileYoutube).toEqual(youtube);

        const twitch = runInjected(source, "twitch.tv");
        expect(twitch).toEqual([
            "http://localhost:48325/normal/tv/twitch/twitch_grayscale.js",
        ]);

        expect(runInjected(source, "unsupported.example")).toEqual([]);
    });

    test("sets the intensity before injecting", () => {
        const source = generateTampermonkeyScript(sampleCatalog);
        const appended: string[] = [];
        const fakeElement = { src: "", setAttribute: () => {}, };
        const fakeDocument = {
            head: { appendChild: (el: { src: string }) => appended.push(el.src) },
            createElement: () => ({ ...fakeElement }),
        };
        const fakeWindow: Record<string, unknown> = { location: { hostname: "youtube.com" } };
        const fn = new Function(
            "document",
            "window",
            "location",
            "setTimeout",
            "console",
            source,
        );
        fn(fakeDocument, fakeWindow, fakeWindow.location, (cb: () => void) => cb(), console);
        expect(fakeWindow.__BOREDOM_INTENSITY__).toBe("medium");
        expect(appended.length).toBeGreaterThan(0);
    });

    test("throws when the catalog has no resistance scripts", () => {
        expect(() => generateTampermonkeyScript(makeCatalog({}))).toThrow(
            /no resistance scripts/,
        );
    });
});
