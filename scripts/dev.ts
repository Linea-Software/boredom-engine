/**
 * Dev server — builds, watches for changes, rebuilds, and serves dist/ on localhost.
 */
import { watch } from "node:fs";
import { join } from "node:path";

const PORT = 48325;
const SRC_DIR = join(import.meta.dir, "..", "src");
const DIST_DIR = join(import.meta.dir, "..", "dist");

let isBuilding = false;
let debounceTimer: Timer | null = null;

function runBuild() {
    if (isBuilding) return;
    isBuilding = true;
    console.log("Change detected. Rebuilding...");
    Bun.spawn(["bun", "run", "build"], {
        stdout: "inherit",
        stderr: "inherit",
    }).exited.then(() => {
        isBuilding = false;
        console.log("Build complete. Watching for changes...");
    });
}

// Initial build
await Bun.spawn(["bun", "run", "build"], {
    stdout: "inherit",
    stderr: "inherit",
}).exited;

// Start file watcher
watch(SRC_DIR, { recursive: true }, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runBuild, 200);
});

// Start HTTP server
Bun.serve({
    port: PORT,
    async fetch(req) {
        const pathname = new URL(req.url).pathname;
        const filePath = join(DIST_DIR, pathname.replace(/\.\./g, ""));
        const file = Bun.file(filePath);
        if (!(await file.exists()))
            return new Response("Not Found", { status: 404 });
        return new Response(file, {
            headers: {
                "Content-Type": filePath.endsWith(".js")
                    ? "application/javascript"
                    : "text/plain",
            },
        });
    },
});

console.log(`🔄 Watching src/ for changes`);
console.log(`📡 Serving dist/ at http://localhost:${PORT}`);
