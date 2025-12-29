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

export async function buildTampermonkey() {
    console.log("Starting Tampermonkey adapter build...");
    const srcSitesDir = join(process.cwd(), "src/sites");
    const files = await getFiles(srcSitesDir);
    const tsFiles = files.filter((f) => f.endsWith(".ts"));

    let bundleContent = "";

    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

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
// ==/UserScript==

(function() {
    'use strict';
    const currentHost = window.location.hostname;

`;
    bundleContent += header;

    for (const fullPath of tsFiles) {
        // Determine Target Logic
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");
        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);
        const pathParts = dirname(relPath).split("/");

        // e.g. com/reddit -> reddit.com
        // e.g. generic -> *

        let matchCondition = "false";

        if (pathParts[0] === "generic") {
            matchCondition = "false";
        } else {
            // Reverse Domain Name Notation
            // pathParts: ['com', 'reddit'] -> domainParts: ['reddit', 'com'] -> host: reddit.com
            // pathParts: ['com', 'google', 'maps'] -> domainParts: ['maps', 'google', 'com'] -> host: maps.google.com
            // We need to reverse pathParts
            const domainParts = [...pathParts].reverse();
            const host = domainParts.join(".");

            matchCondition = `(currentHost === "${host}" || currentHost.endsWith(".${host}"))`;
        }

        console.log(`Bundling ${relPath} for host matching: ${matchCondition}`);

        // Build the script into memory
        const result = await build({
            entryPoints: [fullPath],
            bundle: true,
            write: false,
            platform: "browser",
            target: "es2020",
            minify: true,
        });

        if (result.outputFiles && result.outputFiles.length > 0) {
            const code = result.outputFiles[0].text;

            bundleContent += `
            // Script: ${relPath}
            if (${matchCondition}) {
                try {
                    (function() {
                        ${code}
                    })();
                } catch (e) {
                    console.error("Error executing script for ${relPath}", e);
                }
            }
`;
        }
    }

    bundleContent += `
})();
`;

    await writeFile("dist/tampermonkey.js", bundleContent);
    console.log("Tampermonkey bundle generated at dist/tampermonkey.js");
}
