import { build } from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, sep } from "node:path";

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents.map((dirent) => {
            const res = join(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        })
    );
    return files.flat();
}

function extractMetadata(code: string): {
    name: string;
    description: string;
    version: string;
} {
    const nameMatch = code.match(/@name\s+(.*)/);
    const descMatch = code.match(/@description\s+(.*)/);
    const versionMatch = code.match(/@version\s+(.*)/);

    return {
        name: nameMatch ? nameMatch[1].trim() : "Unknown Script",
        description: descMatch
            ? descMatch[1].trim()
            : "No description provided.",
        version: versionMatch ? versionMatch[1].trim() : "1.0.0",
    };
}

function getMatchCondition(relPath: string): string {
    // We normalized relPath to use forward slashes, so we can split by /
    const pathParts = relPath.split("/").slice(0, -1);

    if (pathParts[0] === "generic") {
        return "false";
    }

    // Reverse Domain Name Notation
    // pathParts: ['com', 'reddit'] -> domainParts: ['reddit', 'com'] -> host: reddit.com
    const domainParts = [...pathParts].reverse();
    const host = domainParts.join(".");

    return `(host === "${host}" || host.endsWith(".${host}"))`;
}

export async function buildTampermonkey() {
    console.log("Starting Tampermonkey adapter build...");
    const srcSitesDir = join(process.cwd(), "src/sites");
    const files = await getFiles(srcSitesDir);
    const tsFiles = files.filter(
        (f) =>
            f.endsWith(".ts") &&
            !f.endsWith(".spec.ts") &&
            !f.endsWith(".test.ts")
    );
    console.log("Files to build:", tsFiles);

    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

    // Load Menu HTML
    const menuHtmlPath = join(
        process.cwd(),
        "scripts/adapters/tampermonkey/menu.html"
    );
    let menuHtml = await readFile(menuHtmlPath, "utf-8");
    // Escape backticks for template literal inclusion
    menuHtml = menuHtml.replace(/`/g, "\\`").replace(/\${/g, "\\${");

    const scriptsData: any[] = [];

    for (const fullPath of tsFiles) {
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");
        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);

        console.log(`Processing ${relPath}...`);

        const rawContent = await readFile(fullPath, "utf-8");
        const metadata = extractMetadata(rawContent);
        const matchCondition = getMatchCondition(relPath);

        let result;
        try {
            result = await build({
                entryPoints: [fullPath],
                bundle: true,
                write: false,
                platform: "browser",
                target: "es2020",
                minify: true,
            });
        } catch (e) {
            console.error(`FAILED to build ${relPath}`);
            throw e;
        }

        if (result.outputFiles && result.outputFiles.length > 0) {
            const code = result.outputFiles[0].text;
            scriptsData.push({
                id: relPath,
                ...metadata,
                matchCondition, // String representation of boolean expression
                code,
            });
        }
    }

    const header = `
// ==UserScript==
// @name         Boredom Engine
// @namespace    http://tampermonkey.net/
// @version      ${packageJson.version || "0.1.0"}
// @description  Boredom Engine Scripts
// @author       LineaSoftware
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;

    // Build Client Runtime
    const clientPath = join(
        process.cwd(),
        "scripts/adapters/tampermonkey/client.ts"
    );
    let clientCode = "";
    try {
        const clientResult = await build({
            entryPoints: [clientPath],
            bundle: true,
            write: false,
            platform: "browser",
            target: "es2020",
            minify: true,
            format: "iife", // IIFE format for isolation, but we need to export 'main' or attach it to global to call it?
            // Actually, if we use iife with a global name, we can call it.
            globalName: "BoredomClient",
        });
        clientCode = clientResult.outputFiles[0].text;
    } catch (e) {
        console.error("Failed to build client runtime", e);
        throw e;
    }

    const runtime = `
(function() {
    'use strict';
    
    // --- Scripts Definition ---
    const scripts = [
        ${scriptsData
            .map(
                (s) => `
        {
            id: "${s.id}",
            name: "${s.name}",
            description: "${s.description.replace(/"/g, '\\"')}",
            version: "${s.version}",
            matches: (host) => ${s.matchCondition},
            execute: function() {
                try {
                    // IIFE for isolation
                    (function() {
                        ${s.code}
                    })();
                } catch (e) {
                    console.error("[BoredomEngine] Error executing ${
                        s.name
                    }:", e);
                }
            }
        }`
            )
            .join(",")}
    ];

    const menuHtml = \`${menuHtml}\`;

    // --- Client Runtime ---
    ${clientCode}

    // Initialize
    // Since we used globalName='BoredomClient', the IIFE exposes 'BoredomClient' to the scope.
    if (typeof BoredomClient !== 'undefined' && BoredomClient.main) {
        BoredomClient.main(scripts, menuHtml);
    } else {
        console.error("BoredomClient runtime failed to load.");
    }

})();
`;

    const finalContent = header + runtime;
    await writeFile("dist/tampermonkey.js", finalContent);
    console.log("Tampermonkey bundle generated at dist/tampermonkey.js");
}
