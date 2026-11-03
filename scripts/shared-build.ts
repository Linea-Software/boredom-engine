/**
 * Build site-scoped shared chunks without changing the TypeScript imports.
 *
 * esbuild is used for its dependency graph/tree shaking. Its ESM chunks are
 * converted to synchronous CommonJS factories, because ACE injects ordinary
 * nonce-authorized inline scripts (not module scripts).
 *
 * The runtime is emitted only when its total size is smaller than the
 * equivalent independent IIFEs. Tampermonkey and the standalone output remain
 * ordinary, self-contained bundles.
 */
import { build, transform, type OutputFile } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const RUNTIME_VERSION = "1";
const MIN_SAVINGS_RATIO = 0.05;

export interface SharedBuildStats {
    site: string;
    mode: "shared" | "standalone";
    standaloneBytes: number;
    outputBytes: number;
    savedBytes: number;
}

export interface SharedBuildResult {
    runtimePaths: Map<string, string>;
    /** Catalog-relative chunk paths needed by each compiled entry script. */
    scriptChunks: Map<string, string[]>;
    stats: SharedBuildStats[];
}

function forwardSlashes(path: string): string {
    return path.split(sep).join("/");
}

function safeInlineScript(source: string): string {
    // A raw closing tag would terminate ACE's inline <script> element.
    return source.replace(/<\/script/gi, "<\\/script");
}

function moduleKey(site: string): string {
    return `ace.boredom.shared.${RUNTIME_VERSION}.${site}`;
}

function runtimePrelude(site: string): string {
    const key = JSON.stringify(moduleKey(site));
    return `(()=>{"use strict";const symbol=Symbol.for(${key});const old=globalThis[symbol];if(old){if(old.version!=="${RUNTIME_VERSION}")throw Error("Incompatible ACE Boredom runtime");return;}const factories=Object.create(null);const cache=Object.create(null);function resolveImport(from,request){if(!request.startsWith("."))throw Error("Unexpected external import: "+request);const segments=from.split("/");segments.pop();for(const part of request.split("/")){if(part==="."||part==="")continue;if(part===".."){if(!segments.length)throw Error("Invalid shared import");segments.pop();}else segments.push(part);}return segments.join("/");}function requireModule(id){if(Object.prototype.hasOwnProperty.call(cache,id))return cache[id].exports;const factory=factories[id];if(!factory)throw Error("Missing ACE shared module: "+id);const module={exports:{}};cache[id]=module;try{factory(module,module.exports,(request)=>requireModule(resolveImport(id,request)));return module.exports;}catch(error){delete cache[id];throw error;}}const runtime={version:"${RUNTIME_VERSION}",register(id,factory){if(Object.prototype.hasOwnProperty.call(factories,id))throw Error("Duplicate ACE shared module: "+id);factories[id]=factory;},run(id,factory){const module={exports:{}};factory(module,module.exports,(request)=>requireModule(resolveImport(id,request)));}};Object.defineProperty(globalThis,symbol,{value:runtime,configurable:true});`;
}

function runtimePostlude(): string {
    return "})();";
}

async function asCommonJs(output: OutputFile): Promise<string> {
    const converted = await transform(output.text, {
        loader: "js",
        format: "cjs",
        target: "es2020",
        minify: true,
    });
    return converted.code;
}

function runtimeWrapper(site: string, file: string, commonJs: string): string {
    const key = JSON.stringify(moduleKey(site));
    return safeInlineScript(`(()=>{"use strict";const runtime=globalThis[Symbol.for(${key})];if(!runtime||runtime.version!=="${RUNTIME_VERSION}")throw Error("ACE Boredom shared runtime unavailable");runtime.run(${JSON.stringify(file)},function(module,exports,require){${commonJs}});})();`);
}

function runtimeSource(site: string): string {
    return safeInlineScript(runtimePrelude(site) + runtimePostlude());
}

function chunkSource(site: string, file: string, commonJs: string): string {
    const key = JSON.stringify(moduleKey(site));
    return safeInlineScript(
        `(()=>{"use strict";const runtime=globalThis[Symbol.for(${key})];if(!runtime||runtime.version!=="${RUNTIME_VERSION}")throw Error("ACE Boredom shared runtime unavailable");runtime.register(${JSON.stringify(file)},function(module,exports,require){${commonJs}});})();`
    );
}

/** Returns site-relative runtime paths for the v1 resistance catalog. */
export async function buildSharedSites(
    entryPoints: string[],
    srcSitesDir: string,
    normalDir: string,
    standaloneDir: string,
): Promise<SharedBuildResult> {
    const groups = new Map<string, string[]>();
    for (const entryPoint of entryPoints) {
        const site = forwardSlashes(dirname(relative(srcSitesDir, entryPoint)));
        const group = groups.get(site) ?? [];
        group.push(entryPoint);
        groups.set(site, group);
    }
    await rm(normalDir, { recursive: true, force: true });
    await mkdir(normalDir, { recursive: true });

    const runtimePaths = new Map<string, string>();
    const scriptChunks = new Map<string, string[]>();
    const stats: SharedBuildStats[] = [];
    for (const site of [...groups.keys()].sort()) {
        const files = groups.get(site)!.sort();
        const entries = files.map((file) =>
            forwardSlashes(relative(srcSitesDir, file)).replace(/\.ts$/, ".js")
        );
        const standaloneSources = await Promise.all(entries.map((path) =>
            readFile(join(standaloneDir, path), "utf8")
        ));
        const standaloneBytes = standaloneSources.reduce(
            (total, source) => total + Buffer.byteLength(source), 0
        );

        const siteBuild = await build({
            entryPoints: files,
            outdir: normalDir,
            outbase: srcSitesDir,
            chunkNames: `${site}/__chunks/[name]-[hash]`,
            bundle: true,
            platform: "browser",
            target: "es2020",
            format: "esm",
            splitting: true,
            minify: true,
            write: false,
            metafile: true,
            logLevel: "warning",
        });
        const outputFiles = siteBuild.outputFiles ?? [];
        const outputByPath = new Map(outputFiles.map((output) => [
            forwardSlashes(relative(resolve(normalDir), output.path)), output
        ]));
        const entrySet = new Set(entries);
        const chunks = [...outputByPath.entries()].filter(([path]) => !entrySet.has(path));
        if (chunks.some(([path]) => !path.endsWith(".js"))) {
            throw new Error(`Unexpected non-JavaScript shared output for ${site}`);
        }

        // esbuild's metafile describes each entry's transitive shared chunks.
        // ACE can then inject only the chunks needed by ENABLED scripts.
        const importsByFile = new Map(
            Object.entries(siteBuild.metafile!.outputs).map(([path, metadata]) => [
                forwardSlashes(relative(resolve(normalDir), resolve(path))),
                metadata.imports
                    .filter((entry) => !entry.external)
                    .map((entry) =>
                        forwardSlashes(relative(resolve(normalDir), resolve(entry.path)))
                    ),
            ] as const)
        );
        const dependenciesFor = (entryPath: string): string[] => {
            const found = new Set<string>();
            const visit = (file: string): void => {
                for (const imported of importsByFile.get(file) ?? []) {
                    if (!outputByPath.has(imported)) {
                        throw new Error(`Missing esbuild chunk: ${imported}`);
                    }
                    if (!found.has(imported)) {
                        found.add(imported);
                        visit(imported);
                    }
                }
            };
            visit(entryPath);
            return [...found].sort();
        };

        let sharedSources = new Map<string, string>();
        let chunkSources = new Map<string, string>();
        let runtime = "";
        if (chunks.length > 0) {
            chunkSources = new Map(await Promise.all(chunks.map(async ([file, output]) =>
                [file, chunkSource(site, file, await asCommonJs(output))] as const
            )));
            runtime = runtimeSource(site);
            sharedSources = new Map(await Promise.all(entries.map(async (file) => {
                const output = outputByPath.get(file);
                if (!output) throw new Error(`Missing entry output for ${file}`);
                return [file, runtimeWrapper(site, file, await asCommonJs(output))] as const;
            })));
        }
        const sharedBytes = Buffer.byteLength(runtime) +
            [...chunkSources.values()].reduce((n, source) => n + Buffer.byteLength(source), 0) +
            [...sharedSources.values()].reduce((n, source) => n + Buffer.byteLength(source), 0);
        const useShared = chunks.length > 0 &&
            sharedBytes < standaloneBytes * (1 - MIN_SAVINGS_RATIO);

        const generated = useShared
            ? sharedSources
            : new Map(entries.map((entry, index) =>
                [entry, standaloneSources[index]] as const
            ));
        for (const [file, source] of generated) {
            const destination = join(normalDir, file);
            await mkdir(dirname(destination), { recursive: true });
            await writeFile(destination, source);
        }
        if (useShared) {
            const runtimePath = `${site}/__ace_shared.js`;
            await writeFile(join(normalDir, runtimePath), runtime);
            runtimePaths.set(site, runtimePath);
            for (const [file, source] of chunkSources) {
                const destination = join(normalDir, file);
                await mkdir(dirname(destination), { recursive: true });
                await writeFile(destination, source);
            }
            for (const file of entries) {
                scriptChunks.set(file, dependenciesFor(file));
            }
        }
        const outputBytes = useShared ? sharedBytes : standaloneBytes;
        stats.push({
            site,
            mode: useShared ? "shared" : "standalone",
            standaloneBytes,
            outputBytes,
            savedBytes: standaloneBytes - outputBytes,
        });
    }
    return { runtimePaths, scriptChunks, stats };
}
