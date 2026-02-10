import { watch } from "fs";
import { join } from "path";

const srcDir = join(import.meta.dir, "../src");

console.log(`Watching for changes in ${srcDir}...`);

let isBuilding = false;
let debounceTimer: Timer | null = null;

const runBuild = () => {
    if (isBuilding) return;
    isBuilding = true;

    console.log("Change detected. Rebuilding...");

    const proc = Bun.spawn(["bun", "run", "build"], {
        stdout: "inherit",
        stderr: "inherit",
    });

    proc.exited.then(() => {
        isBuilding = false;
        console.log("Build complete. Waiting for changes...");
    });
};

// Initial build
runBuild();

watch(srcDir, { recursive: true }, (event, filename) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        runBuild();
    }, 200);
});

// Prevent script from exiting by keeping event loop active
setInterval(() => { }, 1000000);
