import { build } from "esbuild";
import { readdir, readFile, writeFile, access, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
    CATALOG_SCHEMA_VERSION,
    sortCatalog,
    validateCatalog,
    type Catalog,
} from "../catalog-contract.ts";
import { isCompleteScriptMetadata, parseScriptMetadata } from "../metadata.ts";
import { buildSharedSites } from "../shared-build.ts";

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
    sharedChunks?: string[];
}

interface SiteNode {
    scripts: ScriptData[];
    children: Record<string, SiteNode>;
    runtimePath?: string;
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

    // First preserve the original independent IIFEs for fallback and sizing.
    // ACE's normal artifact can use a site-scoped shared runtime when it
    // improves total payload size; Tampermonkey remains entirely independent.
    let runtimePaths = new Map<string, string>();
    let scriptChunks = new Map<string, string[]>();
    // Avoid keeping removed scripts in the local standalone fallback output.
    await rm("dist/standalone", { recursive: true, force: true });
    if (entryPoints.length > 0) {
        await build({
            entryPoints,
            outdir: "dist/standalone",
            bundle: true,
            platform: "browser",
            target: "es2020",
            outbase: "src/sites",
            minify: true,
            format: "iife",
        });
        const shared = await buildSharedSites(
            entryPoints,
            srcSitesDir,
            join(process.cwd(), "dist/normal"),
            join(process.cwd(), "dist/standalone"),
        );
        runtimePaths = shared.runtimePaths;
        scriptChunks = shared.scriptChunks;
        await writeFile(
            "dist/shared-build-stats.json",
            JSON.stringify(shared.stats, null, 2),
        );
        console.log(
            `Shared runtimes: ${runtimePaths.size}/${shared.stats.length} site groups`,
        );
    }

    console.log("Bundling complete.");

    // 2. Generate Data
    console.log("Generating Scripts Data JSON...");

    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    const tsFiles = entryPoints; // Reusing the already filtered list

    const normalSites: Record<string, SiteNode> = {};

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
        const metadata = parseScriptMetadata(content);

        if (!isCompleteScriptMetadata(metadata)) {
            throw new Error(
                `Script ${relPath} is missing required metadata options (@id, @name, @description, @version).`
            );
        }

        const scriptData: ScriptData = {
            id: metadata.id!,
            path: distRelPath,
            name: metadata.name!,
            description: metadata.description!,
            version: metadata.version!,
            sharedChunks: scriptChunks.get(distRelPath),
        };

        try {
            const node = ensureNode(pathParts, normalSites);
            const runtimePath = runtimePaths.get(dirname(relPath));
            if (runtimePath) node.runtimePath = runtimePath;
            node.scripts.push(scriptData);
        } catch (e) {
            console.error(`Error processing ${relPath}:`, e);
            throw e;
        }
    }

    const normalOutput: Catalog = {
        schemaVersion: CATALOG_SCHEMA_VERSION,
        projectName: packageJson.name,
        license: packageJson.license || "MIT",
        sites: normalSites,
    };

    // Deterministic output: stable key/script ordering regardless of the
    // platform's readdir order.
    const sortedNormal = sortCatalog(normalOutput);

    // Validate the resistance catalog against the shared contract before
    // writing anything — a broken catalog must fail the build, not ship.
    const distRoot = join(process.cwd(), "dist");
    validateCatalog(sortedNormal, async (relativePath) => {
        try {
            await access(join(distRoot, "normal", relativePath));
            return true;
        } catch {
            return false;
        }
    });

    await writeFile("dist/scripts-data.json", JSON.stringify(sortedNormal, null, 4));
    console.log("Docs generated at dist/scripts-data.json");
}
