import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

async function main() {
    console.log("Building project...");

    // Run the build command using Bun.spawn or just child_process
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

    const sourceDir = join(process.cwd(), "dist");
    // "C:\ProgramData\LineaSoftware\AceBlocker\scripts"
    // We use double backslashes for string escaping
    const targetDir = "C:\\ProgramData\\LineaSoftware\\AceBlocker\\scripts";

    console.log(`Deploying from ${sourceDir} to ${targetDir}...`);

    try {
        // Ensure target directory exists
        // Note: C:\ProgramData is often restricted, but we attempt it.
        await mkdir(targetDir, { recursive: true });

        // Get list of files in source
        const files = await readdir(sourceDir);

        for (const file of files) {
            if (file === "tampermonkey.js") {
                console.log("Skipping tampermonkey.js");
                continue;
            }

            const sourcePath = join(sourceDir, file);
            const targetPath = join(targetDir, file);

            // Recursive copy
            // Using recursive: true allows copying directories too
            await cp(sourcePath, targetPath, { recursive: true, force: true });
            console.log(`Copied ${file}`);
        }

        console.log("Deployment complete.");
    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main();
