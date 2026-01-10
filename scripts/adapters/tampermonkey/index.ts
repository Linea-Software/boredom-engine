import { build } from "esbuild";
import { rmSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
            (f.endsWith(".ts") || f.endsWith(".js")) &&
            !f.endsWith(".spec.ts") &&
            !f.endsWith(".test.ts") &&
            !f.includes("/shared/") &&
            !f.includes("\\shared\\")
    ); console.log("Files to build:", tsFiles);

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

    // Prepare Intermediate Directory
    const distDir = join(process.cwd(), "dist");
    const intermediateDir = join(distDir, "tm_intermediate");

    // Ensure Clean Directory
    // (Node 14+ recursive mkdir)
    await import("fs").then((fs) => {
        if (fs.existsSync(intermediateDir)) {
            fs.rmSync(intermediateDir, { recursive: true });
        }
        fs.mkdirSync(intermediateDir, { recursive: true });
    });

    const scriptModules: {
        variable: string;
        path: string;
        metadata: any;
        matchExpr: string;
        type: "site" | "generic";
    }[] = [];

    // Helper to process Imports
    function processScriptContent(content: string) {
        const lines = content.split("\n");
        const imports: string[] = [];
        const body: string[] = [];

        let insideMultiLineImport = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("import ") || insideMultiLineImport) {
                imports.push(line);
                if (
                    trimmed.includes("from") &&
                    (trimmed.includes('"') || trimmed.includes("'"))
                ) {
                    insideMultiLineImport = false;
                } else if (
                    trimmed.startsWith("import ") &&
                    !trimmed.includes("from")
                ) {
                    // side-effect import or incomplete
                    if (trimmed.includes('"') || trimmed.includes("'")) {
                        // side effect import like import "foo";
                        insideMultiLineImport = false;
                    } else {
                        insideMultiLineImport = true;
                    }
                }
            } else {
                body.push(line);
            }
        }
        return { imports: imports.join("\n"), body: body.join("\n") };
    }

    for (let i = 0; i < tsFiles.length; i++) {
        const fullPath = tsFiles[i];
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");
        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);

        const rawContent = await readFile(fullPath, "utf-8");
        const metadata = extractMetadata(rawContent);
        const matchCondition = getMatchCondition(relPath);

        const { imports, body } = processScriptContent(rawContent);

        const wrappedContent = `
${imports}

export const metadata = ${JSON.stringify(metadata)};
export const matchCondition = (host: string) => ${matchCondition};

export default function() {
${body}
}
`;
        // Flatten path for intermediate filename
        const safeName = relPath.replace(/[\/\\]/g, "_").replace(".ts", "");
        const moduleFileName = `script_${i}_${safeName}.ts`;
        const modulePath = join(intermediateDir, moduleFileName);

        await writeFile(modulePath, wrappedContent);

        scriptModules.push({
            variable: `script_${i}`,
            path: `./${moduleFileName}`,
            metadata,
            matchExpr: matchCondition,
            type: relPath.startsWith("generic/") ? "generic" : "site",
        });
    }

    // Generate Entry Point
    const entryPath = join(intermediateDir, "index.ts");

    const clientImportPath = "../../scripts/adapters/tampermonkey/client.ts";

    const entryContent = `
import { main } from "${clientImportPath}";

// Import Scripts
${scriptModules
            .map(
                (m) =>
                    `import ${m.variable}, { metadata as ${m.variable}_meta, matchCondition as ${m.variable}_match } from "${m.path}";`
            )
            .join("\n")}

const scripts = [
    ${scriptModules.map((m) =>
                `
    {
        id: "${m.metadata.name}", // Use name or other ID
        name: ${m.variable}_meta.name,
        description: ${m.variable}_meta.description,
        version: ${m.variable}_meta.version,
        matches: ${m.variable}_match,
        execute: ${m.variable},
        type: "${m.type}"
    }`).join(",\n")}
];

const menuHtml = \`${menuHtml}\`;

// Run Client
main(scripts, menuHtml);
`;

    await writeFile(entryPath, entryContent);

    // Bundle
    let bundleCode = "";
    try {
        const result = await build({
            entryPoints: [entryPath],
            bundle: true,
            write: false,
            platform: "browser",
            target: "es2020",
            minify: true,
        });
        bundleCode = result.outputFiles[0].text;
    } catch (e) {
        console.error("Bundle failed", e);
        throw e;
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
// @run-at       document-start
// ==/UserScript==
`;

    const finalContent = header + "\n" + bundleCode;
    await writeFile("dist/tampermonkey.js", finalContent);
    console.log("Tampermonkey bundle generated at dist/tampermonkey.js");

    // cleanup
    rmSync(intermediateDir, { recursive: true });
}
