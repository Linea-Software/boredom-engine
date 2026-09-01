# Boredom Engine

A set of scripts designed to make the web less dopaminic and more boring.

This project uses **Bun** and **TypeScript** to generate and manage userscripts
that modify the appearance and behavior of popular websites to reduce their
addictive nature.

The built artifacts are consumed by **ace-engine**: the engine downloads
`resistance-scripts.zip` (SHA-256 verified), extracts it, loads
`scripts-data.json` into its `InjectableScriptTree`, and injects the matched
scripts into covered sites together with the configured intensity.

## Development

### Install Dependencies

```bash
bun install
```

### Build Scripts

To build the scripts and generate the catalog (`dist/scripts-data.json`):

```bash
bun run build
```

The build fails if any script is missing required JSDoc metadata
(`@id`, `@name`, `@description`, `@version`) or if the produced catalog
violates the [catalog contract](scripts/catalog-contract.ts) (duplicate ids,
absolute/traversal paths, missing files, ...).

### Create distribution ZIPs

```bash
bun run deploy
```

Produces `dist/resistance-scripts.zip` (the v1 beta artifact) and
`dist/tracking-scripts.zip` (kept for reference; not part of the v1
pipeline — nothing injects tracking scripts).

> There is deliberately no local "deploy" copy step anymore: the old code
> copied the ZIP into `C:\ProgramData\LineaSoftware\AceBlocker\scripts`, a
> directory no engine code reads. Uploads go through the ace-blocker-site
> admin panel — see `docs/release.md`.

### Tests

```bash
bun run test            # fast unit tests (metadata, catalog contract, host matching)
bun run test:artifact   # end-to-end: real build + deploy + zip/catalog validation
```

### Dev tools

| Command | Purpose | Machine-modifying? |
|---|---|---|
| `bun run dev` | Rebuild on source change and serve `dist/` on `http://localhost:48325` | no |
| `bun run mock-server` | Local mock of the engine's `/report/usage` and `/report/theme` endpoints | **opt-in only** — set `BOREDOM_ALLOW_SYSTEM_CHANGES=1` to also register `ace-engine.local` in the hosts file and install the generated CA into the Windows root store |
| `bun run dev-chrome` | Launch Chrome with remote debugging on port 9222 | **opt-in only** — pass `--kill-chrome` (or set `BOREDOM_KILL_CHROME=1`) to force-kill running Chrome instances |

### Test in a browser with Tampermonkey

`bun run build` (and `bun run deploy`) also generates a **Tampermonkey test
loader**: `dist/tampermonkey/boredom-engine.user.js`. It is a single userscript
that runs only on the sites covered by the catalog (its `@match` list) and
injects only that host's resistance scripts, using the same reverse-domain
matching as the engine. It is **test-only** — it is not part of
`resistance-scripts.zip`, so ace-engine never sees it.

**Auto-connect through file inclusion:**

1. Serve the built scripts: `bun run dev` (serves `dist/` on
   `http://localhost:48325`).
2. Load the generated userscript into Tampermonkey **from the file**:
   - Tampermonkey dashboard → **Utilities** → **Import from file** → select
     `dist/tampermonkey/boredom-engine.user.js`; or
   - drag-and-drop the `.user.js` onto the Tampermonkey dashboard; or
   - open the file directly in the browser
     (`file://.../boredom-engine/dist/tampermonkey/boredom-engine.user.js`) —
     Tampermonkey auto-detects `.user.js` files and offers to install them. If
     the browser blocks local-file access, enable the extension's **Allow
     access to file URLs** (chrome://extensions → Tampermonkey → Details →
     toggle), or use *Import from file* instead.
3. Tampermonkey auto-enables it. It connects to the dev server and, on a
   supported site, injects that site's scripts automatically. Verify in the
   page console: `[boredom-engine] injected N script(s) for <host>`.

The generated file has a small `CONFIG` block at the top:

- `BASE` — where the site scripts are loaded from (defaults to the dev server).
- `INTENSITY` — `"none" | "low" | "medium" | "high" | "extreme"` (default
  `"medium"`); it is applied as `window.__BOREDOM_INTENSITY__` before the site
  scripts run.

Notes:

- The site scripts are injected into the page's main world via `<script>`
  tags; pages with a strict Content-Security-Policy may block them. ace-engine
  does not have this problem because the MITM proxy injects the scripts before
  CSP enforcement.
- Usage statistics are not reported in this mode: reporting needs the
  `__BOREDOM_SERVER_PORT__` / `__BOREDOM_SERVER_HOSTNAME__` globals, which only
  the engine sets.
- Rebuild with `bun run build` to refresh the loader whenever scripts or sites
  change.

## Project Structure

Scripts are organized using Reverse Domain Name Notation in `src/sites`:

- `src/sites/com/youtube/...`
- `src/sites/tv/twitch/...`
- `src/sites/generic/...` — global scripts applied to every host

Common utilities are located in `src/common`.

### Catalog contract

`scripts/catalog-contract.ts` is the versioned, validated contract shared
conceptually with ace-engine (schema version 1). Key rules:

- `sites` is a reverse-domain tree: `sites.com.youtube` covers
  `youtube.com`, `www.youtube.com`, and subdomains; `sites.generic` scripts
  run on every host.
- Script ids are the **persistence key** in the engine (per-script
  enable/disable state is stored by id). Do not casually rename ids —
  renaming orphans user toggles. The current catalog mixes `-` and `_` id
  styles; normalizing them is deliberately deferred (would require a
  compatibility alias map) and documented in `docs/release.md`.
- Paths are relative to the catalog file, use forward slashes, and must not
  contain `..` or absolute prefixes.
