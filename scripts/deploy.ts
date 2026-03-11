import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as zip from "zip-lib";

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
        // 1. Boredom Scripts Zip (Normal)
        const scriptsZip = new zip.Zip();
        // Add all folders/files from dist/normal
        const normalDir = join(distDir, "normal");
        const normalFiles = await readdir(normalDir);
        for (const f of normalFiles) {
            const fullPath = join(normalDir, f);
            // zip-lib Zip.addFolder/addFile adds the entry with the name provided as second arg (metadata)
            // or just the basename if not provided.
            const stats = await import("node:fs/promises").then(m => m.stat(fullPath));
            if (stats.isDirectory()) {
                scriptsZip.addFolder(fullPath, f);
            } else {
                scriptsZip.addFile(fullPath, f);
            }
        }
        scriptsZip.addFile(join(distDir, "scripts-data.json"), "scripts-data.json");
        await scriptsZip.archive(join(distDir, "boredom-scripts.zip"));
        console.log("Created boredom-scripts.zip");

        // 2. Boredom Tracking Zip
        const trackingZip = new zip.Zip();
        const trackingDir = join(distDir, "tracking");
        const trackingFiles = await readdir(trackingDir);
        for (const f of trackingFiles) {
            const fullPath = join(trackingDir, f);
            const stats = await import("node:fs/promises").then(m => m.stat(fullPath));
            if (stats.isDirectory()) {
                trackingZip.addFolder(fullPath, f);
            } else {
                trackingZip.addFile(fullPath, f);
            }
        }
        trackingZip.addFile(join(distDir, "tracking-scripts.json"), "tracking-scripts.json");
        await trackingZip.archive(join(distDir, "boredom-tracking.zip"));
        console.log("Created boredom-tracking.zip");

    } catch (e) {
        console.error("Zipping failed:", e);
        process.exit(1);
    }

    const targetDir = "C:\\ProgramData\\LineaSoftware\\AceBlocker\\scripts";
    console.log(`Deploying zips to ${targetDir}...`);

    try {
        await mkdir(targetDir, { recursive: true });

        const zips = ["boredom_scripts.zip", "boredom_tracking.zip"];

        for (const zipFile of zips) {
            const sourcePath = join(distDir, zipFile);
            const targetPath = join(targetDir, zipFile);

            await cp(sourcePath, targetPath, { force: true });
            console.log(`Deployed ${zipFile}`);
        }

        console.log("Deployment complete.");
    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main();
