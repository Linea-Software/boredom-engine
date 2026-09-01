/**
 * Tampermonkey adapter — generates a single test userscript that loads the
 * Boredom Engine resistance scripts on supported sites, with a control menu
 * (FAB + panel) for humans and a `window.__BOREDOM_ENGINE__` API for LLMs.
 *
 * The generated file (`dist/tampermonkey/boredom-engine.user.js`) is meant for
 * manual testing in a real browser: install it into Tampermonkey from disk
 * (file inclusion), keep `bun run dev` running to serve `dist/`, and it will
 * run ONLY on sites covered by the catalog (`@match`) and inject ONLY the
 * enabled scripts of that host (the site tree is embedded in the userscript
 * and matched at runtime with the same reverse-domain walk the engine uses).
 *
 * Features:
 * - intensity selector (none/low/medium/high/extreme), applied live and
 *   persisted to localStorage;
 * - per-script enable/disable toggles, persisted to localStorage (enabling
 *   applies live, disabling needs a reload to fully remove effects);
 * - `window.__BOREDOM_ENGINE__` API: getState/getScripts/setIntensity/
 *   enableScript/disableScript/toggleScript/reload.
 *
 * It is NOT part of the engine artifact: `resistance-scripts.zip` (the thing
 * ace-engine consumes) is unaffected.
 *
 * Prerequisite: the resistance catalog must exist (`dist/scripts-data.json`).
 * `bun run build` produces it before this adapter runs.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Catalog, SiteNode } from "../catalog-contract.ts";

const OUTPUT_DIR = "dist/tampermonkey";
const OUTPUT_FILE = "boredom-engine.user.js";
const SCRIPT_VERSION = "2.0.0";

/** A node of the embedded reverse-domain tree; scripts carry id/name/path. */
interface TreeScriptNode {
    scripts: { id: string; name: string; path: string }[];
    children: Record<string, TreeScriptNode>;
}

function emptyNode(): TreeScriptNode {
    return { scripts: [], children: {} };
}

/** `["com", "youtube"]` → `youtube.com` (the host the engine would match). */
export function reverseDomainToHost(labels: string[]): string {
    return [...labels].reverse().join(".");
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
                path: `normal/${entry.path}`,
            })),
            children: {},
        };
        out.children[label] = childOut;
        if (child.scripts.length > 0) {
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
                path: `normal/${entry.path}`,
            })),
            children: {},
        };
        root.children[label] = nodeOut;
        if (siteNode.scripts.length > 0) {
            hosts.add(reverseDomainToHost([label]));
        }
        collectSiteTree(siteNode, [label], hosts, nodeOut);
    }
    return { hosts, root };
}

/** Pure generation: catalog → userscript source. Exported for unit testing. */
export function generateTampermonkeyScript(catalog: Catalog): string {
    const { hosts, root } = buildTree(catalog);

    if (hosts.size === 0) {
        throw new Error("The catalog contains no resistance scripts; nothing to generate.");
    }

    const sortedHosts = [...hosts].sort();
    // Tampermonkey follows Chrome match patterns: `*://*.example.com/*`
    // covers subdomains but NOT the bare domain, so emit both variants.
    const matchLines = sortedHosts
        .map((host) => `// @match        *://${host}/*\n// @match        *://*\.${host}/*`)
        .join("\n");

    const treeJson = JSON.stringify(root);

    return `// ==UserScript==
// @name         Boredom Engine — Tampermonkey test loader
// @namespace    boredom-engine
// @version      ${SCRIPT_VERSION}
// @description  Loads the Boredom Engine resistance scripts on supported sites. Menu + window.__BOREDOM_ENGINE__ API. Test-only: not part of the engine artifact.
${matchLines}
// @noframes
// @run-at       document-start
// @grant        none
// ==/UserScript==

// GENERATED BY scripts/adapters/tampermonkey.ts — do not edit by hand.
// Rebuild with \`bun run build\` (or \`bun run deploy\`).

(function () {
    "use strict";

    var CONFIG = {
        // Base URL that serves dist/ (run \`bun run dev\`, default http://localhost:48325).
        BASE: "http://localhost:48325",
        // Default intensity when nothing is stored yet.
        DEFAULT_INTENSITY: "medium",
        // localStorage key for { intensity, enabled } state.
        STORAGE_KEY: "boredom-engine:state",
        VALID_INTENSITIES: ["none", "low", "medium", "high", "extreme"]
    };

    // Reverse-domain tree of supported sites → scripts [{id, name, path}].
    // path is relative to the dist/ root, prefixed with "normal/".
    var TREE = ${treeJson};

    // In-memory fallback so state works even where localStorage is unavailable.
    var memoryState = null;

    function isValidIntensity(value) {
        return CONFIG.VALID_INTENSITIES.indexOf(value) !== -1;
    }

    function readState() {
        var saved = null;
        try {
            saved = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || "null");
        } catch (e) {
            saved = memoryState;
        }
        if (saved === null || saved === undefined) saved = memoryState;
        var state = saved && typeof saved === "object" ? saved : {};
        if (!isValidIntensity(state.intensity)) state.intensity = CONFIG.DEFAULT_INTENSITY;
        if (!state.enabled || typeof state.enabled !== "object") state.enabled = {};
        return state;
    }

    function writeState(state) {
        memoryState = state;
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            /* ignore: in-memory state still applies for this session */
        }
    }

    function scriptsForHost(hostname) {
        if (!hostname) return [];
        var parts = hostname.toLowerCase().replace(/^www\\./, "").split(".").reverse();
        // Mirrors the engine's walk: descend through children by reversed host
        // label and stop at the first node that carries scripts.
        var node = TREE;
        for (var i = 0; i < parts.length; i++) {
            node = node.children[parts[i]];
            if (!node) return [];
            if (node.scripts && node.scripts.length) return node.scripts;
        }
        return [];
    }

    function isEnabled(state, id) {
        return state.enabled[id] !== false;
    }

    function appendScript(script) {
        if (!document.head) return;
        var s = document.createElement("script");
        s.src = CONFIG.BASE + "/" + script.path;
        s.setAttribute("data-boredom-engine", script.id);
        document.head.appendChild(s);
    }

    function injectEnabledScripts(scripts) {
        if (!document.head) return;
        var state = readState();
        applyIntensity(state.intensity);
        for (var i = 0; i < scripts.length; i++) {
            if (isEnabled(state, scripts[i].id)) appendScript(scripts[i]);
        }
        console.debug(
            "[boredom-engine] injected enabled scripts for " + location.hostname,
        );
    }

    function applyIntensity(intensity) {
        window.__BOREDOM_INTENSITY__ = intensity;
    }

    function reloadPage() {
        try {
            location.reload();
        } catch (e) {
            /* ignore */
        }
    }

    function makePublicApi(scripts) {
        function setScriptEnabled(id, on) {
            var state = readState();
            state.enabled[id] = on;
            writeState(state);
            console.debug(
                "[boredom-engine] script " + id + (on ? " enabled" : " disabled") +
                    " — reload to fully apply",
            );
            if (on) {
                // Live-enable: re-inject the script now so it takes effect
                // without a reload. Disabling needs a reload to remove effects.
                for (var i = 0; i < scripts.length; i++) {
                    if (scripts[i].id === id) appendScript(scripts[i]);
                }
            }
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
                state.scripts = api.getScripts();
                return state;
            },
            setIntensity: function (intensity) {
                if (!isValidIntensity(intensity)) {
                    throw new Error(
                        "Invalid intensity: " + intensity +
                            " (expected one of " + CONFIG.VALID_INTENSITIES.join(", ") + ")",
                    );
                }
                var state = readState();
                state.intensity = intensity;
                writeState(state);
                applyIntensity(intensity);
                console.debug("[boredom-engine] intensity set to " + intensity);
                return api.getState();
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
            ".be-intensity{padding:10px 12px;border-bottom:1px solid #333}",
            ".be-intensity button{margin:2px;padding:4px 8px;border:1px solid #555;background:#222;color:#ccc;border-radius:4px;cursor:pointer;font:inherit}",
            ".be-intensity button.on{background:#2d6cdf;color:#fff;border-color:#2d6cdf}",
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

        var intensityRow = document.createElement("div");
        intensityRow.className = "be-intensity";
        var initial = api.getState();
        CONFIG.VALID_INTENSITIES.forEach(function (level) {
            var b = document.createElement("button");
            b.textContent = level.charAt(0).toUpperCase() + level.slice(1);
            if (level === initial.intensity) b.className = "on";
            b.addEventListener("click", function () {
                api.setIntensity(level);
                Array.prototype.forEach.call(
                    intensityRow.querySelectorAll("button"),
                    function (btn) {
                        btn.className = btn === b ? "on" : "";
                    },
                );
            });
            intensityRow.appendChild(b);
        });
        panel.appendChild(intensityRow);

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
                    checkbox.checked = api.getState().enabled[s.id] !== false;
                });
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(s.name));
                scriptsRow.appendChild(label);
            });
        }
        panel.appendChild(scriptsRow);

        var hint = document.createElement("div");
        hint.className = "be-hint";
        hint.appendChild(
            document.createTextNode(
                "Toggles persist. Enabling applies live; disabling needs a reload — ",
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

    var scripts = scriptsForHost(location.hostname);
    var api = makePublicApi(scripts);
    window.__BOREDOM_ENGINE__ = api;
    console.debug(
        "[boredom-engine] ready on " + location.hostname +
            " — control via window.__BOREDOM_ENGINE__ or the 🧠 menu",
    );

    if (scripts.length > 0) {
        // Inject enabled scripts as soon as <head> exists (document-start).
        var headAttempts = 0;
        (function pollHead() {
            if (document.head) {
                injectEnabledScripts(scripts);
                return;
            }
            if (++headAttempts > 10000) return;
            setTimeout(pollHead, 1);
        })();

        // Build the control menu once <body> exists.
        var bodyAttempts = 0;
        (function pollBody() {
            if (document.body) {
                buildMenu(scripts, api);
                return;
            }
            if (++bodyAttempts > 10000) return;
            setTimeout(pollBody, 1);
        })();
    }
})();
`;
}

/** Build step: read the catalog, generate, and write dist/tampermonkey/. */
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

    const script = generateTampermonkeyScript(catalog);
    const { hosts } = buildTree(catalog);

    await mkdir(join(process.cwd(), OUTPUT_DIR), { recursive: true });
    const outputPath = join(process.cwd(), OUTPUT_DIR, OUTPUT_FILE);
    await writeFile(outputPath, script, "utf-8");

    console.log(`Tampermonkey userscript written to ${outputPath} (${hosts.size} site(s)).`);
}
