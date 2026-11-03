import { describe, expect, test } from "bun:test";
import { build } from "esbuild";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { buildSharedSites } from "../../scripts/shared-build.ts";

describe("site-scoped shared bundles", () => {
    test("reuses the same module once for two IIFE scripts", async () => {
        const root = await mkdtemp(join(tmpdir(), "ace-shared-build-"));
        try {
            const sites = join(root, "src/sites");
            const common = join(root, "src/common.ts");
            const entryA = join(sites, "com/example/a.ts");
            const entryB = join(sites, "com/example/b.ts");
            const standalone = join(root, "dist/standalone");
            const normal = join(root, "dist/normal");
            await mkdir(dirname(entryA), { recursive: true });
            await writeFile(common, `
                const payload = ${JSON.stringify("shared-library".repeat(700))};
                globalThis.__INITIALIZATIONS__ = (globalThis.__INITIALIZATIONS__ ?? 0) + 1;
                export function shared() { return payload.length; }
            `);
            const source = `
                import { shared } from "../../../common";
                globalThis.__RESULTS__.push(shared());
            `;
            await writeFile(entryA, source);
            await writeFile(entryB, source);
            await build({
                entryPoints: [entryA, entryB],
                outdir: standalone,
                outbase: sites,
                bundle: true,
                minify: true,
                format: "iife",
                platform: "browser",
            });
            const built = await buildSharedSites(
                [entryA, entryB], sites, normal, standalone,
            );
            const runtimePath = built.runtimePaths.get("com/example");
            expect(runtimePath).toBe("com/example/__ace_shared.js");
            expect(built.stats[0].savedBytes).toBeGreaterThan(0);

            const scriptA = "com/example/a.js";
            const scriptB = "com/example/b.js";
            const chunksA = built.scriptChunks.get(scriptA) ?? [];
            const chunksB = built.scriptChunks.get(scriptB) ?? [];
            expect(chunksA.length).toBeGreaterThan(0);
            expect(chunksB).toEqual(chunksA);

            const context = createContext({});
            runInContext("globalThis.__RESULTS__ = []", context);
            const ordered = [
                runtimePath!,
                ...new Set([...chunksA, ...chunksB]),
                scriptA,
                scriptB,
            ];
            for (const path of ordered) {
                const source = await readFile(join(normal, path), "utf8");
                expect(source).not.toContain("import(");
                runInContext(source, context, { filename: path });
            }
            expect(context.__RESULTS__).toEqual([
                "shared-library".repeat(700).length,
                "shared-library".repeat(700).length,
            ]);
            expect(context.__INITIALIZATIONS__).toBe(1);

            // The original independent output stays executable without ACE.
            const fallback = createContext({});
            runInContext("globalThis.__RESULTS__ = []", fallback);
            for (const file of [scriptA, scriptB]) {
                runInContext(await readFile(join(standalone, file), "utf8"), fallback);
            }
            expect(fallback.__INITIALIZATIONS__).toBe(2);
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    }, 30_000);
});
