/**
 * JSDoc metadata parsing for script sources.
 *
 * Every script file under `src/sites/` must start with a JSDoc block
 * declaring `@id`, `@name`, `@description`, `@version`.
 * Optional `@tier free` opts into Free; untagged scripts require Pro.
 */

export interface ScriptMetadata {
    id: string | undefined;
    name: string | undefined;
    description: string | undefined;
    version: string | undefined;
    tier: "free" | "pro";
}

/** Matches the leading JSDoc block of a script file. */
export function parseScriptMetadata(content: string): ScriptMetadata {
    const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);
    const metadata: ScriptMetadata = {
        id: undefined,
        name: undefined,
        description: undefined,
        version: undefined,
        tier: "pro",
    };

    if (!commentMatch) return metadata;

    const commentBody = commentMatch[1];
    const field = (tag: string): string | undefined => {
        const match = commentBody.match(new RegExp(`@${tag}\\s+(.*)`));
        return match ? match[1].trim() : undefined;
    };

    metadata.id = field("id");
    metadata.name = field("name");
    metadata.description = field("description");
    metadata.version = field("version");
    const tiers = [...commentBody.matchAll(/^[ \t]*\*[ \t]*@tier\b([^\r\n]*)$/gm)];
    if (tiers.length > 1) {
        throw new Error("Duplicate @tier metadata");
    }
    if (tiers.length === 1) {
        const tier = tiers[0][1].trim();
        if (tier !== "free" && tier !== "pro") {
            throw new Error("Invalid @tier metadata: expected free or pro");
        }
        metadata.tier = tier;
    }
    return metadata;
}

/** True when all required resistance-catalog fields are present. */
export function isCompleteScriptMetadata(metadata: ScriptMetadata): boolean {
    return Boolean(
        metadata.id && metadata.name && metadata.description && metadata.version,
    );
}
