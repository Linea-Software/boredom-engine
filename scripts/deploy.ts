import { join } from "node:path";
import * as zip from "zip-lib";
import { readdir, stat } from "node:fs/promises";

/**
 * Creates the distribution ZIP archives from the built `dist/` tree.
 *
 * v1 beta output: the Resistance Mode artifact (`resistance-scripts.zip`,
 * root layout: `scripts-data.json` + reverse-domain script folders).
 * The tracking ZIP is still produced (existing behavior) but is not part of
 * the v1 pipeline — nothing injects tracking scripts.
 *
 * There is deliberately NO local "deploy" step: the previous code copied the
 * ZIP into `C:\ProgramData\LineaSoftware\AceBlocker\scripts`, a directory no
 * engine code reads. Uploads happen through the ace-blocker-site admin panel
 * (see `docs/release.md`).
 */

async function addDirectoryToZip(archive: zip.Zip, dir: string, prefix: string) {
    const entries = await readdir(dir);
    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const entryName = prefix ? `${prefix}/${entry}` : entry;
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
            await addDirectoryToZip(archive, fullPath, entryName);
        } else {
            archive.addFile(fullPath, entryName);
        }
    }
}

async function createZip(sourceDir: string, catalogFile: string, outputZip: string) {
    const archive = new zip.Zip();
    await addDirectoryToZip(archive, sourceDir, "");
    archive.addFile(join("dist", catalogFile), catalogFile);
    await archive.archive(outputZip);
}

async function main() {
    console.log("Building project...");

    // Run the build command using Bun.spawn
    const proc = Bun.spawn(["bun", "run", "build"], {
        stdout: "inherit",
        stderr: "inherit",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        console.error("Build failed with exit code", exitCode);
        process.exit(1);
    }

    console.log("Build successful.");

    const distDir = join(process.cwd(), "dist");

    // Zipping
    console.log("Creating zip archives...");
    try {
        // 1. Resistance scripts zip (root layout: scripts-data.json + com/... + tv/...)
        await createZip(
            join(distDir, "normal"),
            "scripts-data.json",
            join(distDir, "resistance-scripts.zip"),
        );
        console.log("Created dist/resistance-scripts.zip");

        // 2. Tracking scripts zip (existing behavior; not part of v1).
        await createZip(
            join(distDir, "tracking"),
            "tracking-scripts.json",
            join(distDir, "tracking-scripts.zip"),
        );
        console.log("Created dist/tracking-scripts.zip");
    } catch (e) {
        console.error("Zipping failed:", e);
        process.exit(1);
    }

    console.log("\nDeployment summary:");
    console.log("  dist/resistance-scripts.zip  — upload via the site admin panel");
    console.log("  dist/tracking-scripts.zip    — not part of the v1 pipeline");
    console.log("See docs/release.md for the release procedure.");
}

main();
