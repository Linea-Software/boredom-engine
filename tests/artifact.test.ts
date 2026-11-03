import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as zip from "zip-lib";
import {
    CATALOG_SCHEMA_VERSION,
    treeMatchesHost,
    validateCatalog,
    type Catalog,
    type SiteNode,
} from "../scripts/catalog-contract.ts";

/**
 * End-to-end artifact test: runs the real production build + deploy
 * pipelines and validates the outputs. This is the producer-side half of the
 * engine contract — the engine's `InjectableScriptTree::load_from_json`
 * consumes exactly this ZIP.
 */

const REPO_ROOT = join(import.meta.dir, "..");

function runBun(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const proc = Bun.spawn(["bun", ...args], {
            cwd: REPO_ROOT,
            stdout: "pipe",
            stderr: "pipe",
        });
        proc.exited.then((code) => {
            if (code === 0) resolve(code);
            else {
                const stderr = proc.stderr as ReadableStream;
                stderr
                    .getReader()
                    .read()
                    .then(({ value }) => {
                        reject(
                            new Error(
                                `bun ${args.join(" ")} failed with exit ${code}: ${new TextDecoder().decode(value)}`,
                            ),
                        );
                    });
            }
        });
    });
}

async function extractZip(zipPath: string, targetDir: string): Promise<string[]> {
    // zip-lib's Unzip has no entry-listing API; extract everything (it
    // sanitizes traversal) and list the resulting tree.
    await zip.extract(zipPath, targetDir);
    const files: string[] = [];
    const list = async (dir: string, prefix: string) => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) await list(join(dir, entry.name), rel);
            else files.push(rel);
        }
    };
    await list(targetDir, "");
    return files;
}

beforeAll(async () => {
    await runBun(["run", "build"]);
    await runBun(["run", "deploy"]);
}, 45_000);

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

describe("production artifact", () => {
    test("build + deploy succeed and produce the resistance zip archive", async () => {
        expect(await pathExists(join(REPO_ROOT, "dist", "resistance-scripts.zip"))).toBe(true);
        expect(await pathExists(join(REPO_ROOT, "dist", "scripts-data.json"))).toBe(true);
    });

    test("catalog validates against the shared contract", async () => {
        const catalog = JSON.parse(
            await readFile(join(REPO_ROOT, "dist", "scripts-data.json"), "utf-8"),
        ) as Catalog;
        expect(catalog.schemaVersion).toBe(CATALOG_SCHEMA_VERSION);

        const distNormal = join(REPO_ROOT, "dist", "normal");
        await validateCatalog(catalog, async (relativePath) => {
            try {
                await access(join(distNormal, relativePath));
                return true;
            } catch {
                return false;
            }
        });
    });

    test("zip root layout matches the engine contract", async () => {
        const extractDir = await mkdtemp(join(tmpdir(), "boredom-zip-"));
        try {
            const entries = await extractZip(
                join(REPO_ROOT, "dist", "resistance-scripts.zip"),
                extractDir,
            );

            // The catalog sits at the zip root.
            expect(entries).toContain("scripts-data.json");
            // Reverse-domain top-level folders (no 'dist/' or 'normal/' prefix).
            expect(entries.some((e) => e.startsWith("com/youtube/"))).toBe(true);
            expect(entries.some((e) => e.startsWith("tv/twitch/"))).toBe(true);
            expect(entries.some((e) => e.startsWith("dist/") || e.startsWith("normal/"))).toBe(false);
            expect(entries.some((e) => e.startsWith("../"))).toBe(false);

            // Every catalog entry exists in the extracted zip at the exact path.
            const catalog = JSON.parse(
                await readFile(join(REPO_ROOT, "dist", "scripts-data.json"), "utf-8"),
            ) as Catalog;
            const seen = new Set(entries);
            const walk = (node: SiteNode) => {
                if (node.runtimePath) {
                    expect(seen.has(node.runtimePath), `missing ${node.runtimePath} in zip`).toBe(true);
                }
                for (const entry of node.scripts) {
                    expect(seen.has(entry.path), `missing ${entry.path} in zip`).toBe(true);
                    for (const chunk of entry.sharedChunks ?? []) {
                        expect(seen.has(chunk), `missing ${chunk} in zip`).toBe(true);
                    }
                }
                for (const child of Object.values(node.children)) walk(child);
            };
            for (const site of Object.values(catalog.sites)) walk(site);
        } finally {
            await rm(extractDir, { recursive: true, force: true });
        }
    });

    test("catalog host coverage includes the beta's representative sites", async () => {
        const catalog = JSON.parse(
            await readFile(join(REPO_ROOT, "dist", "scripts-data.json"), "utf-8"),
        ) as Catalog;
        for (const host of [
            "youtube.com",
            "www.instagram.com",
            "facebook.com",
            "reddit.com",
            "www.tiktok.com",
            "twitch.tv",
            "x.com",
            "www.linkedin.com",
            "www.pinterest.com",
            "www.threads.net",
            "www.netflix.com",
            "news.ycombinator.com",
            "web.snapchat.com",
        ]) {
            expect(treeMatchesHost(catalog, host), `host ${host} should be covered`).toBe(true);
        }
        expect(treeMatchesHost(catalog, "uncovered-site.example")).toBe(false);
    });

    test("dist/normal and the catalog are consistent (every built file is referenced)", async () => {
        const catalog = JSON.parse(
            await readFile(join(REPO_ROOT, "dist", "scripts-data.json"), "utf-8"),
        ) as Catalog;
        const catalogPaths = new Set<string>();
        const walk = (node: SiteNode) => {
            if (node.runtimePath) catalogPaths.add(node.runtimePath);
            for (const entry of node.scripts) {
                catalogPaths.add(entry.path);
                for (const chunk of entry.sharedChunks ?? []) catalogPaths.add(chunk);
            }
            for (const child of Object.values(node.children)) walk(child);
        };
        for (const site of Object.values(catalog.sites)) walk(site);

        const normalFiles: string[] = [];
        const list = async (dir: string, prefix: string) => {
            for (const entry of await readdir(dir, { withFileTypes: true })) {
                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) await list(join(dir, entry.name), rel);
                else normalFiles.push(rel);
            }
        };
        await list(join(REPO_ROOT, "dist", "normal"), "");

        const referenced = new Set(normalFiles.filter((f) => catalogPaths.has(f)));
        expect(referenced.size).toBe(catalogPaths.size);
        expect(referenced.size).toBeGreaterThan(20);
        // Every shipped runtime/chunk is accounted for; no stale build output.
        expect([...normalFiles].sort()).toEqual([...catalogPaths].sort());
    });

    test("no `dist/normal` bundle initializes usage tracking (regression: barrel leak)", async () => {
        // Approved requirement: no normal Resistance Mode bundle may initialize
        // usage tracking. Previously `src/common/index.ts` re-exported
        // `usage-stats`, whose module-level `onDOMLoaded(initUsageTracking)`
        // side effect pulled the tracking init (+ `POST /report/usage`
        // heartbeat) into every resistance bundle. After the barrel export is
        // removed, none of these markers may appear in the fresh dist/normal
        // output.
        const forbidden = ["report/usage", "__BOREDOM_TRACKING_INIT__", "report/theme"];
        const distNormal = join(REPO_ROOT, "dist", "normal");
        const files: string[] = [];
        const list = async (dir: string, prefix: string) => {
            for (const entry of await readdir(dir, { withFileTypes: true })) {
                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) await list(join(dir, entry.name), rel);
                else files.push(rel);
            }
        };
        await list(distNormal, "");

        expect(files.length).toBeGreaterThan(0);
        for (const rel of files) {
            const code = await readFile(join(distNormal, rel), "utf-8");
            for (const marker of forbidden) {
                expect(
                    code,
                    `dist/normal/${rel} must not contain '${marker}' (usage tracking must not init)`,
                ).not.toContain(marker);
            }
        }
    });
});
