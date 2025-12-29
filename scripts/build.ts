import { build } from "esbuild";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import * as TypeDoc from "typedoc";

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

async function bundle() {
    console.log("Starting build...");
    const srcSitesDir = join(process.cwd(), "src/sites");
    const files = await getFiles(srcSitesDir);
    const entryPoints = files.filter((f) => f.endsWith(".ts"));

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
}

async function generateDocs() {
    console.log("Generating TypeDoc JSON...");
    const app = await TypeDoc.Application.bootstrap({
        entryPoints: ["src/sites"],
        entryPointStrategy: "expand",
        exclude: ["node_modules", "**/*.test.ts"],
        skipErrorChecking: true,
    });

    const project = await app.convert();

    if (project) {
        await app.generateJson(project, "dist/scripts-data.json");
        console.log("Docs generated at dist/scripts-data.json");
    } else {
        console.error("TypeDoc conversion failed.");
    }
}

async function main() {
    try {
        await bundle();
        await generateDocs();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
