# Shared resistance bundles (ACE Engine)

The source files under `src/sites` and `src/common` keep ordinary,
fully typed TypeScript imports. No script needs to know whether it will be
injected standalone or with shared dependencies.

## Build products

`bun run build` runs `tsc --noEmit` first and produces:

- `dist/standalone/`: original fully self-contained minified IIFEs.
- `dist/normal/`: ACE injection artifacts (shared or standalone per site).
- `dist/tampermonkey/`: independent Tampermonkey output, unchanged.
- `dist/shared-build-stats.json`: per-site before/after byte counts.

For each site directory, esbuild generates a split ESM module graph. The
build converts its static imports into synchronous factories and wraps
them in ordinary IIFEs. This is important because ACE inserts nonce-authorized
classic `<script>` elements, not ESM `type=module` scripts. The factory
cache is scoped to a versioned `Symbol.for` key per site and per JS world.
Nothing is fetched from a CDN, nor are runtime `import()` calls required.

Splitting is accepted only if the total of the small bootstrap, registration
chunks and entry wrappers is **at least 5% smaller** than the site's
independent bundles. Otherwise `dist/normal/` contains its original
standalone files. This decision is based on total site payload, not guaranteed
to be optimal if a user enables only one script; at injection time ACE loads
only the chunk dependencies of enabled scripts to limit that overhead.

## Catalog contract

The existing `scripts-data.json` tree includes two optional properties:

```json
{
  "sites": {
    "com": {
      "scripts": [],
      "children": {
        "example": {
          "runtimePath": "com/example/__ace_shared.js",
          "scripts": [
            {
              "id": "example-script",
              "path": "com/example/example-script.js",
              "name": "Example",
              "description": "Example",
              "version": "1",
              "sharedChunks": ["com/example/__chunks/chunk-ABCDE.js"]
            }
          ],
          "children": {}
        }
      }
    }
  }
}
```

All paths are relative to the catalog at the ZIP root, use forward slashes
and must not traverse outside the archive. `sharedChunks` includes
transitive dependencies. ACE loads a site's bootstrap, then the distinct
registered chunks required by **enabled** scripts, then their entry IIFEs.
Each module is evaluated only on first request within that page world.
Missing or unsafe assets fail the package load rather than leaving the
scripts half-initialized.

Deploy `dist/resistance-scripts.zip` using the normal release process.
**Ship the producer and ACE consumer changes together**, since older ACE
versions do not understand the additional runtime assets.

## Verification

```sh
bun run check
bun test tests/unit
bun run test:artifact
```

`tests/unit/shared-build.test.ts` executes the generated runtime and two
entries in a JavaScript VM, verifies that a shared module initializes once
and confirms the independent fallback still works. Artifact tests verify
that every referenced bootstrap and chunk is present in the ZIP and that
no stale unreferenced file is packaged.
