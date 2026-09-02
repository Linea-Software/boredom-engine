/**
 * JSDoc metadata parsing for script sources.
 *
 * Every script file under `src/sites/` must start with a JSDoc block
 * declaring `@id`, `@name`, `@description`, `@version`.
 */

export interface ScriptMetadata {
    id: string | undefined;
    name: string | undefined;
    description: string | undefined;
    version: string | undefined;
}

/** Matches the leading JSDoc block of a script file. */
export function parseScriptMetadata(content: string): ScriptMetadata {
    const commentMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);
    const metadata: ScriptMetadata = {
        id: undefined,
        name: undefined,
        description: undefined,
        version: undefined,
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
    return metadata;
}

/** True when all required resistance-catalog fields are present. */
export function isCompleteScriptMetadata(metadata: ScriptMetadata): boolean {
    return Boolean(
        metadata.id && metadata.name && metadata.description && metadata.version,
    );
}
