import { describe, expect, test } from "bun:test";
import {
    CATALOG_SCHEMA_VERSION,
    CatalogValidationError,
    flattenCatalog,
    sortCatalog,
    treeMatchesHost,
    validateCatalog,
    type Catalog,
    type SiteNode,
} from "../../scripts/catalog-contract.ts";
import {
    isCompleteScriptMetadata,
    parseScriptMetadata,
} from "../../scripts/metadata.ts";

const alwaysExists = () => true;
const neverExists = () => false;

function makeCatalog(sites: Record<string, SiteNode>): Catalog {
    return {
        schemaVersion: CATALOG_SCHEMA_VERSION,
        projectName: "boredom-engine",
        license: "MIT",
        sites,
    };
}

function node(scripts: Record<string, unknown>[] = [], children: Record<string, SiteNode> = {}): SiteNode {
    return { scripts: scripts as never, children };
}

const script = (overrides: Record<string, unknown> = {}) => ({
    id: "youtube-grayscale",
    path: "com/youtube/grayscale.js",
    name: "Grayscale",
    description: "Dulls colors.",
    version: "1.0.0",
    ...overrides,
});

describe("parseScriptMetadata", () => {
    test("parses all required fields from a JSDoc block", () => {
        const content = `/**
 * @id youtube-grayscale
 * @name YouTube Grayscale
 * @description Dulls the colors on YouTube.
 * @version 1.2.3
 */
export function main() {}`;
        const metadata = parseScriptMetadata(content);
        expect(metadata).toEqual({
            id: "youtube-grayscale",
            name: "YouTube Grayscale",
            description: "Dulls the colors on YouTube.",
            version: "1.2.3",
        });
        expect(isCompleteScriptMetadata(metadata)).toBe(true);
    });

    test("missing metadata fields are reported as incomplete", () => {
        const content = `/**
 * @id youtube-grayscale
 * @name Grayscale
 */`;
        const metadata = parseScriptMetadata(content);
        expect(isCompleteScriptMetadata(metadata)).toBe(false);
    });

    test("files without a JSDoc block have no metadata", () => {
        expect(parseScriptMetadata("export const x = 1;").id).toBeUndefined();
    });
});

describe("validateCatalog", () => {
    test("accepts a valid catalog", async () => {
        const catalog = makeCatalog({
            com: node(
                [],
                {
                    youtube: node([script()]),
                },
            ),
            generic: node([script({ id: "generic-grayscale", path: "generic/grayscale.js" })]),
        });
        await expect(validateCatalog(catalog, alwaysExists)).resolves.toBeUndefined();
    });

    test("rejects duplicate script ids", async () => {
        const catalog = makeCatalog({
            com: node([], {
                youtube: node([script(), script({ id: "youtube-grayscale" })]),
            }),
        });
        await expect(validateCatalog(catalog, alwaysExists)).rejects.toThrow(
            CatalogValidationError,
        );
        try {
            await validateCatalog(catalog, alwaysExists);
        } catch (error) {
            expect(error).toBeInstanceOf(CatalogValidationError);
            expect((error as CatalogValidationError).issues.some((i) => i.message.includes("duplicate script id"))).toBe(true);
        }
    });

    test("rejects missing metadata and wrong schema version", async () => {
        const badVersion = { ...makeCatalog({}), schemaVersion: 99 };
        await expect(validateCatalog(badVersion, alwaysExists)).rejects.toThrow(/schemaVersion/);

        const missingName = makeCatalog({
            com: node([], { youtube: node([script({ name: "" })]) }),
        });
        await expect(validateCatalog(missingName, alwaysExists)).rejects.toThrow(/name is required/);
    });

    test("rejects absolute paths, traversal and backslashes", async () => {
        for (const badPath of [
            "/etc/passwd",
            "C:\\Windows\\system32",
            "../../secret.js",
            "com/youtube/..\\escape.js",
        ]) {
            const catalog = makeCatalog({
                com: node([], { youtube: node([script({ path: badPath })]) }),
            });
            await expect(
                validateCatalog(catalog, alwaysExists),
                `path '${badPath}' must be rejected`,
            ).rejects.toThrow(CatalogValidationError);
        }
    });

    test("rejects catalog entries pointing at missing files", async () => {
        const catalog = makeCatalog({
            com: node([], { youtube: node([script()]) }),
        });
        await expect(validateCatalog(catalog, neverExists)).rejects.toThrow(
            /referenced file does not exist/,
        );
    });

    test("rejects non-js paths", async () => {
        const catalog = makeCatalog({
            com: node([], { youtube: node([script({ path: "com/youtube/grayscale.txt" })]) }),
        });
        await expect(validateCatalog(catalog, alwaysExists)).rejects.toThrow(/must end with \.js/);
    });
});

describe("sortCatalog", () => {
    test("produces deterministic ordering regardless of input order", () => {
        const unsorted = makeCatalog({
            tv: node([], {
                twitch: node([
                    script({ id: "z-script" }),
                    script({ id: "a-script" }),
                ]),
            }),
            com: node([], {
                youtube: node([script({ id: "m-script" })]),
            }),
        });
        const sorted = sortCatalog(unsorted);

        expect(Object.keys(sorted.sites)).toEqual(["com", "tv"]);
        const twitchScripts = sorted.sites.tv.children.twitch.scripts.map((s) => s.id);
        expect(twitchScripts).toEqual(["a-script", "z-script"]);

        // Deep equality: sorting is idempotent.
        expect(sortCatalog(sorted)).toEqual(sorted);
    });

    test("flattenCatalog walks every entry with its site path", () => {
        const catalog = sortCatalog(
            makeCatalog({
                com: node([], {
                    youtube: node([script()]),
                }),
                generic: node([script({ id: "generic-grayscale", path: "generic/grayscale.js" })]),
            }),
        );
        const flat = flattenCatalog(catalog);
        expect(flat).toHaveLength(2);
        expect(flat.map((f) => f.sitePath).sort()).toEqual(["com.youtube", "generic"]);
    });
});

describe("treeMatchesHost", () => {
    const catalog = sortCatalog(
        makeCatalog({
            com: node([], {
                youtube: node([script()]),
                facebook: node([script({ id: "facebook-block-feed", path: "com/facebook/block-feed.js" })]),
            }),
        }),
    );

    const catalogWithGeneric = sortCatalog({
        ...catalog,
        sites: {
            ...catalog.sites,
            generic: node([script({ id: "generic-grayscale", path: "generic/grayscale.js" })]),
        },
    });

    test("matches the exact host and the www. variant", () => {
        expect(treeMatchesHost(catalog, "youtube.com")).toBe(true);
        expect(treeMatchesHost(catalog, "www.youtube.com")).toBe(true);
    });

    test("matches subdomains", () => {
        expect(treeMatchesHost(catalog, "m.youtube.com")).toBe(true);
        expect(treeMatchesHost(catalog, "www.facebook.com")).toBe(true);
    });

    test("does not match unrelated hosts", () => {
        expect(treeMatchesHost(catalog, "example.com")).toBe(false);
        expect(treeMatchesHost(catalog, "youtube.net")).toBe(false);
        expect(treeMatchesHost(catalog, "notyoutube.com")).toBe(false);
        expect(treeMatchesHost(catalog, "")).toBe(false);
    });

    test("generic scripts match every host", () => {
        expect(treeMatchesHost(catalogWithGeneric, "anything.example")).toBe(true);
        expect(treeMatchesHost(catalogWithGeneric, "")).toBe(true);
        expect(treeMatchesHost(catalog, "anything.example")).toBe(false);
    });
});
