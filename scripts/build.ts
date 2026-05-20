import { buildDefault } from "./adapters/default.ts";

async function main() {
    try {
        await buildDefault();
    } catch (e) {
        console.error("Build failed:", e);
        process.exit(1);
    }
}

main();
