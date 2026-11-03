import { buildDefault } from "./adapters/default.ts";
import { buildTampermonkey } from "./adapters/tampermonkey.ts";

async function main() {
    try {
        // esbuild strips TS types but does not validate them. Keep strict
        // source-level diagnostics independent of the runtime packaging.
        const check = Bun.spawnSync(["bun", "run", "check"], {
            stdout: "inherit",
            stderr: "inherit",
        });
        if (check.exitCode !== 0) {
            throw new Error("TypeScript check failed");
        }
        await buildDefault();
        await buildTampermonkey();
    } catch (e) {
        console.error("Build failed:", e);
        process.exit(1);
    }
}

main();
