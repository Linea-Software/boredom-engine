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
    rules?: any;
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

    await build({
        entryPoints: entryPoints,
        outdir: "dist",
        bundle: true,
        platform: "browser",
        target: "es2020",
        outbase: "src/sites",
        minify: true,
    });

    console.log("Bundling complete.");

    // 2. Generate Data
    console.log("Generating Scripts Data JSON...");

    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    const tsFiles = files.filter(
        (f) =>
            f.endsWith(".ts") &&
            !f.endsWith(".spec.ts") &&
            !f.endsWith(".test.ts") &&
            !f.includes("/shared/") &&
            !f.includes("\\shared\\")
    );

    const sites: Record<string, SiteNode> = {};

    const ensureNode = (pathParts: string[]): SiteNode => {
        let currentLevel = sites;
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
        // Paths
        // Normalize paths for consistent comparison
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");

        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);
        const distRelPath = relPath.replace(/\.ts$/, ".js");
        const distPath = distRelPath; // relative path for output

        const pathParts = dirname(relPath).split("/");

        // Parse content
        const content = await readFile(fullPath, "utf-8");
        const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);

        let id: string | undefined;
        let name: string | undefined;
        let description: string | undefined;
        let version: string | undefined;

        if (commentMatch) {
            const commentBody = commentMatch[1];
            const idMatch = commentBody.match(/@id\s+(.*)/);
            const nameMatch = commentBody.match(/@name\s+(.*)/);
            const descMatch = commentBody.match(/@description\s+(.*)/);
            const verMatch = commentBody.match(/@version\s+(.*)/);

            if (idMatch) id = idMatch[1].trim();
            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
            if (verMatch) version = verMatch[1].trim();
        }

        if (!id || !name || !description || !version) {
            throw new Error(
                `Script ${relPath} is missing required metadata options (@id, @name, @description, @version).`
            );
        }

        const scriptData: ScriptData = {
            id,
            path: distPath,
            name,
            description,
            version,
        };

        try {
            const node = ensureNode(pathParts);
            node.scripts.push(scriptData);
        } catch (e) {
            console.error(`Error processing ${relPath}:`, e);
            throw e; // Stop build on error
        }
    }

    // 3. Process Rules JSON files
    const rulesFiles = files.filter((f) => f.endsWith(".rules.json"));
    for (const fullPath of rulesFiles) {
        const normalizedFullPath = fullPath.replace(/\\/g, "/");
        const normalizedSrcSites = srcSitesDir.replace(/\\/g, "/");
        const relPath = normalizedFullPath.slice(normalizedSrcSites.length + 1);
        const pathParts = dirname(relPath).split("/");

        try {
            const content = await readFile(fullPath, "utf-8");
            const rules = JSON.parse(content);

            if (rules.$schema) {
                delete rules.$schema;
            }

            const node = ensureNode(pathParts);
            node.rules = rules;
        } catch (e) {
            console.error(`Error processing rules ${relPath}:`, e);
            throw e;
        }
    }

    const output = {
        projectName: packageJson.name,
        license: packageJson.license || "MIT",
        sites: sites,
    };

    await writeFile("dist/scripts-data.json", JSON.stringify(output, null, 4));
    console.log("Docs generated at dist/scripts-data.json");
}
