import { buildDefault } from "./adapters/default.ts";
import { buildTampermonkey } from "./adapters/tampermonkey";

async function main() {
    try {
        await buildDefault();

        await buildTampermonkey();
    } catch (e) {
        console.error("Build failed:", e);
        process.exit(1);
    }
}

main();
