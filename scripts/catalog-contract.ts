/**
 * Catalog contract for the resistance-scripts artifact.
 *
 * This module is the shared, versioned contract between boredom-engine
 * (producer) and ace-engine (consumer). It validates a built catalog +
 * dist tree and guarantees deterministic output.
 *
 * Contract summary (schema version 1):
 *
 * - `schemaVersion: 1` — added to the catalog root; unknown fields are
 *   ignored by the engine's serde parser, so this is a forward-compatible
 *   addition. The engine must fail loudly (it does) on incompatible shapes.
 * - `projectName`, `license` — informational.
 * - `sites` — a reverse-domain tree: `sites.com.youtube.scripts[]` covers
 *   `youtube.com` / `www.youtube.com` (the engine strips `www.` and walks
 *   the reversed host labels). `sites.generic` is special: its scripts are
 *   global (injected on every host).
 * - Every script entry has: `id` (stable — the engine persists per-script
 *   enable state BY ID, so IDs must never be renamed casually), `path`
 *   (relative to the catalog file, forward slashes, no `..`, no absolute
 *   paths), `name`, `description`, `version`.
 */

export interface ScriptData {
    /** Opt-in for interruptions and visual degradation; deterministic per script. */
    defaultEnabled?: boolean;
    id: string;
    path: string;
    name: string;
    description: string;
    version: string;
}

export interface SiteNode {
    scripts: ScriptData[];
    children: Record<string, SiteNode>;
}

export interface Catalog {
    schemaVersion: number;
    projectName: string;
    license: string;
    sites: Record<string, SiteNode>;
}

export const CATALOG_SCHEMA_VERSION = 1;

export interface CatalogIssue {
    message: string;
    path?: string;
}

export class CatalogValidationError extends Error {
    issues: CatalogIssue[];
    constructor(issues: CatalogIssue[]) {
        super(
            `Catalog validation failed with ${issues.length} issue(s):\n` +
                issues.map((issue) => `  - ${issue.path ? `[${issue.path}] ` : ""}${issue.message}`).join("\n"),
        );
        this.name = "CatalogValidationError";
        this.issues = issues;
    }
}

/** Collects every script entry in the tree with its site path. */
export function flattenCatalog(catalog: Catalog): { entry: ScriptData; sitePath: string }[] {
    const result: { entry: ScriptData; sitePath: string }[] = [];
    const visit = (node: SiteNode, sitePath: string) => {
        for (const entry of node.scripts) {
            result.push({ entry, sitePath });
        }
        for (const [name, child] of Object.entries(node.children)) {
            visit(child, sitePath ? `${sitePath}.${name}` : name);
        }
    };
    for (const [site, node] of Object.entries(catalog.sites)) {
        visit(node, site);
    }
    return result;
}

/**
 * Validates the catalog contract. `fileExists` is injected so tests can run
 * without touching the real dist tree.
 */
export async function validateCatalog(
    catalog: Catalog,
    fileExists: (relativePath: string) => Promise<boolean> | boolean,
): Promise<void> {
    const issues: CatalogIssue[] = [];

    if (catalog.schemaVersion !== CATALOG_SCHEMA_VERSION) {
        issues.push({
            message: `schemaVersion must be ${CATALOG_SCHEMA_VERSION}, got ${catalog.schemaVersion}`,
        });
    }
    if (!catalog.projectName) {
        issues.push({ message: "projectName is required" });
    }

    const seenIds = new Map<string, string>();
    for (const { entry, sitePath } of flattenCatalog(catalog)) {
        const where = `${sitePath}/${entry.id}`;

        if (!entry.id) {
            issues.push({ message: "script id is required", path: sitePath });
        }
        if (seenIds.has(entry.id)) {
            issues.push({
                message: `duplicate script id '${entry.id}' (also used at ${seenIds.get(entry.id)})`,
                path: where,
            });
        } else if (entry.id) {
            seenIds.set(entry.id, where);
        }

        if (!entry.name) {
            issues.push({ message: "script name is required", path: where });
        }
        if (!entry.description) {
            issues.push({ message: "script description is required", path: where });
        }
        if (!entry.version) {
            issues.push({ message: "script version is required", path: where });
        }

        // Path contract: relative, forward slashes, no traversal, no absolutes.
        if (!entry.path) {
            issues.push({ message: "script path is required", path: where });
        } else {
            if (entry.path.startsWith("/") || /^[a-zA-Z]:/.test(entry.path)) {
                issues.push({ message: `absolute path not allowed: '${entry.path}'`, path: where });
            }
            if (entry.path.includes("\\")) {
                issues.push({
                    message: `backslashes not allowed (use forward slashes): '${entry.path}'`,
                    path: where,
                });
            }
            const parts = entry.path.split("/");
            if (parts.some((part) => part === ".." || part === "." || part === "")) {
                issues.push({
                    message: `path must not contain '..', '.' or empty segments: '${entry.path}'`,
                    path: where,
                });
            }
            if (!entry.path.endsWith(".js")) {
                issues.push({ message: `path must end with .js: '${entry.path}'`, path: where });
            }
            if (!(await fileExists(entry.path))) {
                issues.push({ message: `referenced file does not exist: '${entry.path}'`, path: where });
            }
        }
    }

    if (issues.length > 0) {
        throw new CatalogValidationError(issues);
    }
}

/** Deep-sorts the catalog so output is byte-deterministic across platforms. */
export function sortCatalog(catalog: Catalog): Catalog {
    const sortNode = (node: SiteNode): SiteNode => {
        const scripts = [...node.scripts].sort((a, b) => a.id.localeCompare(b.id));
        const children: Record<string, SiteNode> = {};
        for (const name of Object.keys(node.children).sort()) {
            children[name] = sortNode(node.children[name]);
        }
        return { scripts, children };
    };

    const sites: Record<string, SiteNode> = {};
    for (const site of Object.keys(catalog.sites).sort()) {
        sites[site] = sortNode(catalog.sites[site]);
    }
    return {
        schemaVersion: catalog.schemaVersion,
        projectName: catalog.projectName,
        license: catalog.license,
        sites,
    };
}

/**
 * Replicates the engine's host-matching rules (`InjectableScriptTree`) so the
 * producer can test its assumptions:
 * - root-level scripts (from `sites.generic`) apply to every host;
 * - the host is lowercased, `www.` stripped, split on '.', reversed, and the
 *   tree is walked label by label; a node matches when it has enabled scripts
 *   (in the beta the engine treats all loaded scripts as enabled at the tree
 *   level, per-script enable state is applied on top).
 */
export function treeMatchesHost(catalog: Catalog, host: string): boolean {
    const hasEnabled = (node: SiteNode): boolean => node.scripts.length > 0;
    const generic = catalog.sites["generic"];
    if (generic && hasEnabled(generic)) return true;

    if (!host) return false;
    const clean = host.split(":")[0].toLowerCase().replace(/^www\./, "");
    const parts = clean.split(".").reverse();

    let node: SiteNode | undefined;
    for (const part of parts) {
        node = (node ?? { scripts: [], children: catalog.sites }).children[part];
        if (!node) return false;
        if (hasEnabled(node)) return true;
    }
    return false;
}
