/**
 * Tampermonkey adapter — generates a single test userscript that loads the
 * Boredom Engine resistance scripts on supported sites via Tampermonkey
 * `@require` (local `file://` files), with a control menu (FAB + panel) for
 * humans and a `window.__BOREDOM_ENGINE__` API for LLMs.
 *
 * Why `@require` instead of runtime `<script src>` injection? Injected script
 * tags are subject to the page's CSP and can be blocked; `@require` files are
 * read by Tampermonkey at install/update time and become part of the
 * userscript, so no server needs to serve them at runtime.
 *
 * Generated artifacts under `dist/tampermonkey/`:
 * - `boredom-engine.user.js` — the userscript to install. Its header lists
 *   `@match` for every covered host and `@require`s (in order) the bootstrap
 *   and every wrapped site script via absolute `file://` URLs.
 * - `bootstrap.js` — loader core: reads persisted state, sets
 *   `window.__BOREDOM_STATE__` BEFORE the
 *   site scripts execute, exposes `window.__BOREDOM_ENGINE__`, and builds the
 *   🧠 control menu.
 * - `scripts/<site-path>` — each dist/normal bundle wrapped in a guard that
 *   only runs the script when the current host's site matches and the script
 *   is enabled.
 *
 * Features:
 * - per-script enable/disable toggles, persisted to localStorage (reload to
 *   fully apply — @require'd scripts execute at load time);
 * - `window.__BOREDOM_ENGINE__` API: getState/getScripts/
 *   enableScript/disableScript/toggleScript/reload.
 *
 * It is NOT part of the engine artifact: `resistance-scripts.zip` (the thing
 * ace-engine consumes) is unaffected.
 *
 * Prerequisite: the resistance catalog and the normal bundles must exist
 * (`dist/scripts-data.json`, `dist/normal/...`). `bun run build` produces them
 * before this adapter runs.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Catalog, SiteNode } from "../catalog-contract.ts";

const OUTPUT_DIR = "dist/tampermonkey";
const BOOTSTRAP_FILE = "bootstrap.js";
const SCRIPTS_DIR = "scripts";
const USERSCRIPT_FILE = "boredom-engine.user.js";
const SCRIPT_VERSION = "3.0.0";

/** A node of the embedded reverse-domain tree; scripts carry id/name/path. */
interface TreeScriptNode {
    /** Site path (e.g. "com/youtube") — set on nodes that carry scripts. */
    site?: string;
    scripts: { id: string; name: string; path: string; defaultEnabled?: boolean }[];
    children: Record<string, TreeScriptNode>;
}

function emptyNode(): TreeScriptNode {
    return { scripts: [], children: {} };
}

/** `["com", "youtube"]` → `youtube.com` (the host the engine would match). */
export function reverseDomainToHost(labels: string[]): string {
    return [...labels].reverse().join(".");
}

/** `"com/youtube/youtube_grayscale.js"` → `"com/youtube"`. */
function sitePathOf(scriptPath: string): string {
    return dirname(scriptPath).replace(/\\/g, "/");
}

/**
 * Walks a catalog site node, mirroring the engine's reverse-domain tree, and
 * collects the hosts that carry scripts (for `@match`) plus the embedded tree.
 */
function collectSiteTree(
    node: SiteNode,
    labels: string[],
    hosts: Set<string>,
    out: TreeScriptNode,
): void {
    for (const [label, child] of Object.entries(node.children)) {
        const nextLabels = [...labels, label];
        const childOut: TreeScriptNode = {
            scripts: child.scripts.map((entry) => ({
                id: entry.id,
                name: entry.name,
                path: entry.path,
                defaultEnabled: entry.defaultEnabled,
            })),
            children: {},
        };
        out.children[label] = childOut;
        if (child.scripts.length > 0) {
            childOut.site = nextLabels.join("/");
            hosts.add(reverseDomainToHost(nextLabels));
        }
        collectSiteTree(child, nextLabels, hosts, childOut);
    }
}

/**
 * Builds the embedded reverse-domain tree and the set of covered hosts from a
 * catalog. Mirrors the engine's walk: a host is covered when its reversed
 * label path reaches a node that carries scripts.
 */
function buildTree(catalog: Catalog): { hosts: Set<string>; root: TreeScriptNode } {
    const hosts = new Set<string>();
    const root = emptyNode();
    for (const [label, siteNode] of Object.entries(catalog.sites)) {
        const nodeOut: TreeScriptNode = {
            scripts: siteNode.scripts.map((entry) => ({
                id: entry.id,
                name: entry.name,
                path: entry.path,
                defaultEnabled: entry.defaultEnabled,
            })),
            children: {},
        };
        root.children[label] = nodeOut;
        if (siteNode.scripts.length > 0) {
            nodeOut.site = label;
            hosts.add(reverseDomainToHost([label]));
        }
        collectSiteTree(siteNode, [label], hosts, nodeOut);
    }
    return { hosts, root };
}

/** All catalog script entries with their site path. */
function flattenEntries(catalog: Catalog): { id: string; name: string; path: string; site: string }[] {
    const out: { id: string; name: string; path: string; site: string }[] = [];
    const walk = (node: SiteNode) => {
        for (const entry of node.scripts) {
            out.push({
                id: entry.id,
                name: entry.name,
                path: entry.path,
                site: sitePathOf(entry.path),
            });
        }
        for (const child of Object.values(node.children)) walk(child);
    };
    for (const site of Object.values(catalog.sites)) walk(site);
    return out;
}

/**
 * Wraps a built site bundle so it only executes when the loader matched the
 * script's site and the script is enabled. Exported for unit testing.
 */
export function wrapScript(original: string, scriptId: string, sitePath: string): string {
    const idJson = JSON.stringify(scriptId);
    const siteJson = JSON.stringify(sitePath);
    return (
        `if (window.__BOREDOM_STATE__ && window.__BOREDOM_STATE__.currentSite === ${siteJson} ` +
        `&& window.__BOREDOM_STATE__.enabled[${idJson}] !== false) {\n` +
        `${original}\n` +
        `}\n`
    );
}

/**
 * Pure generation: catalog → bootstrap loader core (the FIRST `@require`). It
 * runs before the site scripts and sets per-script state + API + menu.
 */
export function generateBootstrapScript(catalog: Catalog): string {
    const { root } = buildTree(catalog);
    const treeJson = JSON.stringify(root);

    return `(function () {
    "use strict";

    var CONFIG = { STORAGE_KEY: "boredom-engine:state" };

    // Reverse-domain tree of supported sites → scripts [{id, name, path}].
    // Nodes that carry scripts also carry their site path (e.g. "com/youtube").
    var TREE = ${treeJson};

    // In-memory fallback so state works even where localStorage is unavailable.
    var memoryState = null;

    function readState() {
        var saved = null;
        try {
            saved = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || "null");
        } catch (e) {
            saved = memoryState;
        }
        if (saved === null || saved === undefined) saved = memoryState;
        var state = saved && typeof saved === "object" ? saved : {};
        if (!state.enabled || typeof state.enabled !== "object") state.enabled = {};
        // Discard any persisted legacy global level rather than re-exposing it.
        delete state.intensity;
        var node = nodeForHost(location.hostname);
        if (node) node.scripts.forEach(function (script) {
            if (state.enabled[script.id] === undefined) {
                state.enabled[script.id] = script.defaultEnabled !== false;
            }
        });
        return state;
    }

    function writeState(state) {
        memoryState = state;
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ enabled: state.enabled }));
        } catch (e) {
            /* ignore: in-memory state still applies for this session */
        }
    }

    // Mirrors the engine's walk: descend through children by reversed host
    // label and stop at the first node that carries scripts.
    function nodeForHost(hostname) {
        if (!hostname) return null;
        var parts = hostname.toLowerCase().replace(/^www\\./, "").split(".").reverse();
        var node = TREE;
        for (var i = 0; i < parts.length; i++) {
            node = node.children[parts[i]];
            if (!node) return null;
            if (node.scripts && node.scripts.length) return node;
        }
        return null;
    }

    function isEnabled(state, id) {
        return state.enabled[id] !== false;
    }

    function reloadPage() {
        try {
            location.reload();
        } catch (e) {
            /* ignore */
        }
    }

    function makePublicApi(node) {
        var scripts = node ? node.scripts : [];
        function setScriptEnabled(id, on) {
            var state = readState();
            state.enabled[id] = on;
            writeState(state);
            console.debug(
                "[boredom-engine] script " + id + (on ? " enabled" : " disabled") +
                    " — reload to apply",
            );
            reloadPage();
            return api.getState();
        }

        var api = {
            getScripts: function () {
                var state = readState();
                return scripts.map(function (s) {
                    return {
                        id: s.id,
                        name: s.name,
                        path: s.path,
                        enabled: isEnabled(state, s.id),
                    };
                });
            },
            getState: function () {
                var state = readState();
                state.currentSite = node ? node.site : null;
                state.scripts = api.getScripts();
                return state;
            },
            enableScript: function (id) {
                return setScriptEnabled(id, true);
            },
            disableScript: function (id) {
                return setScriptEnabled(id, false);
            },
            toggleScript: function (id) {
                return setScriptEnabled(id, !isEnabled(readState(), id));
            },
            reload: reloadPage,
            // Test-only eval: run arbitrary JS in the page context. Used by the
            // test harness (menu textarea) to inspect the live DOM / verify
            // effects, since the loader cannot otherwise be introspected.
            evalJs: function (code) {
                try {
                    var result = (0, eval)(code);
                    if (result === undefined) return "(void 0)";
                    if (result === null) return "null";
                    var json;
                    try {
                        json = JSON.stringify(result);
                    } catch (e) {
                        json = null;
                    }
                    return json !== undefined && json !== null
                        ? json
                        : String(result);
                } catch (e) {
                    return "Error: " + (e && e.message);
                }
            },
        };
        return api;
    }

    function buildMenu(scripts, api) {
        var style = document.createElement("style");
        style.textContent = [
            ".be-fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:48px;height:48px;border-radius:50%;background:#111;color:#fff;border:1px solid #444;cursor:pointer;font:bold 20px/1 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.5)}",
            ".be-panel{position:fixed;right:16px;bottom:72px;z-index:2147483001;width:280px;max-height:70vh;overflow:auto;background:#111;color:#eee;border:1px solid #444;border-radius:8px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.6);display:none}",
            ".be-panel.open{display:block}",
            ".be-panel h2{margin:0;padding:10px 12px;font-size:14px;border-bottom:1px solid #333}",
            ".be-scripts{padding:6px 12px 10px}",
            ".be-scripts label{display:flex;gap:8px;align-items:center;padding:3px 0;cursor:pointer}",
            ".be-scripts input{accent-color:#2d6cdf}",
            ".be-hint{padding:0 12px 10px;color:#999;font-size:11px}",
            ".be-hint a{color:#7aa2ff;cursor:pointer;text-decoration:underline}"
        ].join("");
        (document.head || document.documentElement).appendChild(style);

        var fab = document.createElement("button");
        fab.className = "be-fab";
        fab.textContent = "🧠";
        fab.title = "Boredom Engine";
        fab.setAttribute("aria-label", "Boredom Engine menu");

        var panel = document.createElement("div");
        panel.className = "be-panel";

        var title = document.createElement("h2");
        title.textContent = "Boredom Engine";
        panel.appendChild(title);

        var scriptsRow = document.createElement("div");
        scriptsRow.className = "be-scripts";
        var current = api.getScripts();
        if (current.length === 0) {
            scriptsRow.textContent = "No scripts for this site.";
        } else {
            current.forEach(function (s) {
                var label = document.createElement("label");
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = s.enabled;
                checkbox.addEventListener("change", function () {
                    if (checkbox.checked) api.enableScript(s.id);
                    else api.disableScript(s.id);
                });
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(s.name));
                scriptsRow.appendChild(label);
            });
        }
        panel.appendChild(scriptsRow);

        // Test-only JS eval runner: type code, click Run, read the result.
        // Lets the test harness inspect the live DOM / verify script effects.
        var jsDiv = document.createElement("div");
        var jsInput = document.createElement("textarea");
        jsInput.rows = 2;
        jsInput.placeholder = "window.__BOREDOM_ENGINE__.getScripts()";
        jsInput.style.cssText =
            "display:block;width:100%;box-sizing:border-box;margin:6px 12px 0;" +
            "background:#222;color:#eee;border:1px solid #555;border-radius:4px;" +
            "padding:4px;font:12px monospace;resize:vertical";
        var jsRun = document.createElement("button");
        jsRun.textContent = "Run";
        jsRun.style.cssText =
            "margin:4px 12px 0;padding:3px 10px;border:1px solid #555;background:#222;" +
            "color:#ccc;border-radius:4px;cursor:pointer;font:inherit";
        var jsResult = document.createElement("pre");
        jsResult.style.cssText =
            "margin:4px 12px 8px;background:#141414;color:#8c8;border:1px solid #333;" +
            "border-radius:4px;padding:4px;font:11px monospace;white-space:pre-wrap;" +
            "max-height:140px;overflow:auto";
        // CSP-aware runner: try eval first; if the page CSP blocks unsafe-eval
        // (e.g. Instagram), inject the code as a blob: <script> instead, which is
        // allowed by script-src blob: and bypasses the unsafe-eval restriction.
        function runEval(code) {
            try {
                var out = window.__BOREDOM_ENGINE__.evalJs(code);
                if (
                    String(out).indexOf("Error: ") === 0 &&
                    /Content Security Policy|unsafe-eval|script/i.test(String(out))
                ) {
                    return runBlob(code);
                }
                return { ok: true, text: String(out) };
            } catch (e) {
                var eMsg = e && e.message;
                if (/Content Security Policy|unsafe-eval|script/i.test(eMsg)) {
                    return runBlob(code);
                }
                return { ok: false, text: "Error: " + eMsg };
            }
        }
        function runBlob(code) {
            window.__BOREDOM_EVAL_OUT__ = "(running)";
            var body =
                "(function(){try{var __r;__r=(" + code + ");window.__BOREDOM_EVAL_OUT__=" +
                "(typeof __r==='object'&&__r!==null)?(function(){try{return JSON.stringify(__r)}" +
                "catch(_e){return String(__r)}})():String(__r);}" +
                "catch(_e){window.__BOREDOM_EVAL_OUT__='Error: '+_e.message;}})();";
            var blob;
            try {
                blob = new Blob([body], { type: "text/javascript" });
            } catch (e) {
                return { ok: false, text: "Error: blob unavailable: " + e.message };
            }
            var url = URL.createObjectURL(blob);
            var s = document.createElement("script");
            s.src = url;
            s.onload = function () { URL.revokeObjectURL(url); };
            (document.head || document.documentElement).appendChild(s);
            return { ok: true, async: true };
        }

        jsRun.addEventListener("click", function () {
            var code = jsInput.value;
            if (!code.trim()) { jsResult.textContent = "(empty)"; return; }
            var res = runEval(code);
            jsResult.textContent = res.text;
            if (res.async) {
                var tries = 0;
                var timer = setInterval(function () {
                    tries++;
                    if (window.__BOREDOM_EVAL_OUT__ !== "(running)" || tries > 60) {
                        clearInterval(timer);
                        jsResult.textContent = String(window.__BOREDOM_EVAL_OUT__);
                    }
                }, 25);
            }
        });
        jsDiv.appendChild(jsInput);
        jsDiv.appendChild(jsRun);
        panel.appendChild(jsDiv);
        panel.appendChild(jsResult);

        var hint = document.createElement("div");
        hint.className = "be-hint";
        hint.appendChild(
            document.createTextNode(
                "Toggles persist and reload to apply — ",
            ),
        );
        var reloadLink = document.createElement("a");
        reloadLink.textContent = "reload now";
        reloadLink.addEventListener("click", api.reload);
        hint.appendChild(reloadLink);
        hint.appendChild(
            document.createTextNode(". API: window.__BOREDOM_ENGINE__"),
        );
        panel.appendChild(hint);

        fab.addEventListener("click", function () {
            panel.classList.toggle("open");
        });

        (document.body || document.documentElement).appendChild(fab);
        (document.body || document.documentElement).appendChild(panel);
    }

    var node = nodeForHost(location.hostname);
    var state = readState();
    var currentSite = node ? node.site : null;

    // Publish state BEFORE the site scripts (later @require files) execute.
    window.__BOREDOM_STATE__ = {
        currentSite: currentSite,
        enabled: state.enabled,
    };
    window.__BOREDOM_ENGINE__ = makePublicApi(node);
    window.__BOREDOM_EVAL__ = window.__BOREDOM_ENGINE__.evalJs;
    console.debug(
        "[boredom-engine] ready on " + location.hostname + " (site: " + currentSite + ")" +
            " — control via window.__BOREDOM_ENGINE__ or the 🧠 menu",
    );

    if (node && node.scripts.length > 0) {
        // Build the control menu once <body> exists.
        var bodyAttempts = 0;
        (function pollBody() {
            if (document.body) {
                buildMenu(node.scripts, window.__BOREDOM_ENGINE__);
                return;
            }
            if (++bodyAttempts > 10000) return;
            setTimeout(pollBody, 1);
        })();
    }
})();
`;
}

/** Script URL fragments for the `@require` list. */
interface RequireFiles {
    bootstrapUrl: string;
    scriptUrls: string[];
}

/**
 * Pure generation: catalog + local file URLs → the `.user.js` to install.
 * The bootstrap is required FIRST so it runs before every site script.
 */
export function generateUserscript(catalog: Catalog, files: RequireFiles): string {
    const { hosts } = buildTree(catalog);

    if (hosts.size === 0) {
        throw new Error("The catalog contains no resistance scripts; nothing to generate.");
    }

    const sortedHosts = [...hosts].sort();
    // Tampermonkey follows Chrome match patterns: `*://*.example.com/*`
    // covers subdomains but NOT the bare domain, so emit both variants.
    const matchLines = sortedHosts
        .map((host) => `// @match        *://${host}/*\n// @match        *://*\.${host}/*`)
        .join("\n");

    const requireLines = [files.bootstrapUrl, ...files.scriptUrls]
        .map((url) => `// @require      ${url}`)
        .join("\n");

    return `// ==UserScript==
// @name         Boredom Engine — Tampermonkey test loader
// @namespace    boredom-engine
// @version      ${SCRIPT_VERSION}
// @description  Loads the Boredom Engine resistance scripts on supported sites via @require. Menu + window.__BOREDOM_ENGINE__ API. Test-only: not part of the engine artifact.
${matchLines}
${requireLines}
// @noframes
// @run-at       document-start
// @grant        none
// ==/UserScript==

// GENERATED BY scripts/adapters/tampermonkey.ts — do not edit by hand.
// Rebuild with \`bun run build\` (or \`bun run deploy\`), then reload this
// script in Tampermonkey so it re-reads the @require files.

(function () {
    "use strict";
    // Everything lives in the @require'd files (bootstrap first, then the
    // wrapped site scripts). This body is intentionally minimal.
    if (typeof console !== "undefined" && typeof console.debug === "function") {
        console.debug(
            "[boredom-engine] userscript loaded — control via window.__BOREDOM_ENGINE__ or the 🧠 menu",
        );
    }
})();
`;
}

/** Build step: read the catalog + normal bundles, write all tampermonkey files. */
export async function buildTampermonkey(): Promise<void> {
    console.log("Building Tampermonkey userscript...");

    const catalogPath = join(process.cwd(), "dist", "scripts-data.json");
    let catalog: Catalog;
    try {
        catalog = JSON.parse(await readFile(catalogPath, "utf-8")) as Catalog;
    } catch {
        throw new Error(
            "Missing dist/scripts-data.json — run `bun run build` first so the resistance catalog exists.",
        );
    }

    const { hosts } = buildTree(catalog);
    const entries = flattenEntries(catalog);
    if (entries.length === 0) {
        throw new Error("The catalog contains no resistance scripts; nothing to generate.");
    }

    const tampermonkeyDir = join(process.cwd(), OUTPUT_DIR);
    const scriptsOutDir = join(tampermonkeyDir, SCRIPTS_DIR);
    await mkdir(scriptsOutDir, { recursive: true });

    // 1. Wrapped site scripts (guard: matching site + enabled).
    const scriptUrls: string[] = [];
    for (const entry of entries) {
        const original = await readFile(join(process.cwd(), "dist", "normal", entry.path), "utf-8");
        const wrapped = wrapScript(original, entry.id, entry.site);
        const outPath = join(scriptsOutDir, entry.path);
        await mkdir(join(scriptsOutDir, dirname(entry.path)), { recursive: true });
        await writeFile(outPath, wrapped, "utf-8");
        scriptUrls.push(pathToFileURL(outPath).href);
    }

    // 2. Bootstrap loader (must be required first).
    const bootstrap = generateBootstrapScript(catalog);
    const bootstrapPath = join(tampermonkeyDir, BOOTSTRAP_FILE);
    await writeFile(bootstrapPath, bootstrap, "utf-8");

    // 3. The userscript itself.
    const userscript = generateUserscript(catalog, {
        bootstrapUrl: pathToFileURL(bootstrapPath).href,
        scriptUrls,
    });
    const userscriptPath = join(tampermonkeyDir, USERSCRIPT_FILE);
    await writeFile(userscriptPath, userscript, "utf-8");

    console.log(
        `Tampermonkey userscript written to ${userscriptPath} (${hosts.size} site(s), ` +
            `${entries.length} script(s) via @require).`,
    );
}
