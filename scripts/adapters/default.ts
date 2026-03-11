import { build } from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";

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

interface ScriptData {
    id: string;
    path: string;
    name: string;
    description: string;
    version: string;
}

interface SiteNode {
    scripts: ScriptData[];
    children: Record<string, SiteNode>;
}

export async function buildDefault() {
    console.log("Starting Default build...");

    // 1. Bundle
    const srcSitesDir = join(process.cwd(), "src/sites");
    const files = await getFiles(srcSitesDir);
    const entryPoints = files.filter(
        (f) =>
            f.endsWith(".ts") &&
            !f.endsWith(".spec.ts") &&
            !f.endsWith(".test.ts") &&
            !f.includes("/shared/") &&
            !f.includes("\\shared\\")
    );

    console.log(`Found ${entryPoints.length} entry points.`);

    const normalEntryPoints: string[] = [];
    const trackingEntryPoints: string[] = [];
    
    // First, determine the type of each script
    for (const file of entryPoints) {
        const content = await readFile(file, "utf-8");
        const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);
        let isUsage = false;
        if (commentMatch) {
            const commentBody = commentMatch[1];
            const typeMatch = commentBody.match(/@type\s+(.*)/);
            if (typeMatch && typeMatch[1].trim() === "usage") {
                isUsage = true;
            }
        }
        if (isUsage) {
            trackingEntryPoints.push(file);
        } else {
            normalEntryPoints.push(file);
        }
    }

    if (normalEntryPoints.length > 0) {
        await build({
            entryPoints: normalEntryPoints,
            outdir: "dist/normal",
            bundle: true,
            platform: "browser",
            target: "es2020",
            outbase: "src/sites",
            minify: true,
            format: "iife", // Just to be safe for browser content scripts
        });
    }

    if (trackingEntryPoints.length > 0) {
        await build({
            entryPoints: trackingEntryPoints,
            outdir: "dist/tracking",
            bundle: true,
            platform: "browser",
            target: "es2020",
            outbase: "src/sites",
            minify: true,
            format: "iife",
        });
    }

    console.log("Bundling complete.");

    // 2. Generate Data
    console.log("Generating Scripts Data JSON...");

    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    const tsFiles = entryPoints; // Reusing the already filtered list

    const normalSites: Record<string, SiteNode> = {};
    const trackingSites: Record<string, SiteNode> = {};

    const ensureNode = (pathParts: string[], sitesObj: Record<string, SiteNode>): SiteNode => {
        let currentLevel = sitesObj;
        let lastNode: SiteNode | undefined;

        for (const part of pathParts) {
            if (part === ".") continue;
            if (!currentLevel[part]) {
                currentLevel[part] = { scripts: [], children: {} };
            }
            lastNode = currentLevel[part];
            currentLevel = lastNode.children;
        }

        if (!lastNode) throw new Error("Path empty");
        return lastNode;
    };

    for (const fullPath of tsFiles) {
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");

        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);
        const distRelPath = relPath.replace(/\.ts$/, ".js");

        const pathParts = dirname(relPath).split("/");

        const content = await readFile(fullPath, "utf-8");
        const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);

        let id: string | undefined;
        let name: string | undefined;
        let description: string | undefined;
        let version: string | undefined;
        let isUsage = false;

        if (commentMatch) {
            const commentBody = commentMatch[1];
            const idMatch = commentBody.match(/@id\s+(.*)/);
            const nameMatch = commentBody.match(/@name\s+(.*)/);
            const descMatch = commentBody.match(/@description\s+(.*)/);
            const verMatch = commentBody.match(/@version\s+(.*)/);
            const typeMatch = commentBody.match(/@type\s+(.*)/);

            if (idMatch) id = idMatch[1].trim();
            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
            if (verMatch) version = verMatch[1].trim();
            if (typeMatch && typeMatch[1].trim() === "usage") isUsage = true;
        }

        if (!id || !name || !description || !version) {
            throw new Error(
                `Script ${relPath} is missing required metadata options (@id, @name, @description, @version).`
            );
        }

        // distPath logic uses the respective directory now
        const scriptData: ScriptData = {
            id,
            path: distRelPath,
            name,
            description,
            version,
        };

        try {
            if (isUsage) {
                const node = ensureNode(pathParts, trackingSites);
                node.scripts.push(scriptData);
            } else {
                const node = ensureNode(pathParts, normalSites);
                node.scripts.push(scriptData);
            }
        } catch (e) {
            console.error(`Error processing ${relPath}:`, e);
            throw e; 
        }
    }

    const normalOutput = {
        projectName: packageJson.name,
        license: packageJson.license || "MIT",
        sites: normalSites,
    };

    const trackingOutput = {
        projectName: packageJson.name,
        license: packageJson.license || "MIT",
        sites: trackingSites,
    };

    await writeFile("dist/scripts-data.json", JSON.stringify(normalOutput, null, 4));
    await writeFile("dist/tracking-scripts.json", JSON.stringify(trackingOutput, null, 4));
    console.log("Docs generated at dist/scripts-data.json and dist/tracking-scripts.json");
}
