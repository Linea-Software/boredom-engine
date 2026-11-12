# Boredom Engine

A set of scripts designed to make the web less dopaminic and more boring.

This project uses **Bun** and **TypeScript** to generate and manage userscripts
that modify the appearance and behavior of popular websites to reduce their
addictive nature.

The built artifacts are consumed by **ace-engine**: the engine downloads
`resistance-scripts.zip` (SHA-256 verified), extracts it, loads
`scripts-data.json` into its `InjectableScriptTree`, and injects the matched
scripts into covered sites only when each intervention is enabled.

## Development

**Research policy:** Before implementing or repairing a site-specific action,
look for and download relevant Chrome extension and userscript source code as
references for how that action is achieved on that website; cross-check with
live site behavior. Follow [Site reference research](docs/SITE_REFERENCE_RESEARCH.md)
for safety, licensing, verification and test expectations.

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

Produces `dist/resistance-scripts.zip` (the v1 beta artifact). Usage tracking
is fully removed — there is no distributed tracking artifact.

**GitHub Releases:** open **Actions → Publish Resistance Mode Release →
Run workflow**, select `main`, enter a version such as `1.2.3`, and start
the job. The workflow validates the version, checks types, runs tests, builds
the archive and creates the `v1.2.3` tag plus GitHub Release automatically.
Pushing an existing tag such as `v1.2.3` also triggers the workflow.
There is no monthly schedule. Each release publishes
`resistance-scripts.zip`, `sha256_checksums.txt` and `scripts-data.json`.
An admin can then import the latest release from GitHub through
`/admin/releases/resistance` on ace-blocker-site, verify its import status,
and explicitly make it available to clients. See `docs/release.md`.

> There is deliberately no local "deploy" copy step anymore: the old code
> copied the ZIP into `C:\ProgramData\LineaSoftware\AceBlocker\scripts`, a
> directory no engine code reads. Uploads go through the ace-blocker-site
> admin panel — see `docs/release.md`.

### Tests

```bash
bun run test            # fast unit tests (metadata, catalog contract, host matching)
bun run test:artifact   # end-to-end: real build + deploy + zip/catalog validation
```

### Live website verification (opt-in)

Use the production IIFE in a clean browser against the current live site:

```sh
bun run test:live --site youtube --script youtube_shorts_remove --headed
```

The runner compares baseline and script-enabled tabs. It writes local JSON and
screenshots, and reports missing site targets as inconclusive rather than
passing them. See [Live Site Testing](docs/LIVE_SITE_TESTING.md) for supported
scenarios, isolated login profiles, CDP, and the separate ACE proxy release test.

### Dev tools

| Command | Purpose | Machine-modifying? |
|---|---|---|
| `bun run dev` | Rebuild on source change and serve `dist/` on `http://localhost:48325` | no |
| `bun run dev-chrome` | Launch Chrome with remote debugging on port 9222 | **opt-in only** — pass `--kill-chrome` (or set `BOREDOM_KILL_CHROME=1`) to force-kill running Chrome instances |

### ACE Blocker direct injection (production)

**ACE Blocker does not use Tampermonkey.** The production build is
`dist/normal/` plus `dist/scripts-data.json`, packaged by `bun run deploy`
into `dist/resistance-scripts.zip`. ACE Engine loads the script tree and
uses its MITM proxy to insert each enabled site's JavaScript as nonce-bearing
inline `<script>` tags in the top-level HTML, and rewrites response-header
and HTML-meta CSP where needed. Each intervention has its own enabled state;
visual degradation and deliberate interruptions default to opt-in. There is no Tampermonkey
bootstrap, `@require`, or `window.__BOREDOM_ENGINE__` control API in ACE.

Run the ACE-shaped browser regression tests (direct bundles, strict CSP,
including YouTube's Trusted Types policy) with:

```bash
bun run check
bun run test:smoke --grep "ACE direct injection"
bun run test:artifact
```

This is a **browser simulation of the ACE injection format**, not a full test
of the actual privileged MITM proxy, TLS routing, entitlement, installed
content version or site-account state. For the latter, verify the downloaded
`scriptsVersion`, Pro entitlement, resistance master switch, enabled script
IDs in ACE Engine; then inspect proxy logs for injection into the top-level
YouTube document. Changes to interventions affect newly loaded documents.

**Important release distinction:** pushing source to `main` does *not*
update ACE Blocker. Publish a new GitHub Release, import it in the
ace-blocker-site admin, mark it available, then have ACE Engine refresh its
content. See [release procedure](docs/release.md).

### Optional Tampermonkey test loader (not used by ACE Blocker)

`bun run build` (and `bun run deploy`) also generates a **Tampermonkey test
loader** under `dist/tampermonkey/`:

- `boredom-engine.user.js` — the userscript to install. It runs only on the
  sites covered by the catalog (its `@match` list) and `@require`s the loader
  and the site scripts as **local `file://` files** (baked-in absolute paths).
- `bootstrap.js` — loader core: publishes per-script `window.__BOREDOM_STATE__`
  before the site scripts run, exposes `window.__BOREDOM_ENGINE__`, and builds the 🧠 control menu.
- `scripts/...` — each site script wrapped in a guard so it only executes on
  its own site and only while enabled.

The site scripts are delivered through Tampermonkey's `@require` at
install/update time, so no server needs to serve them at runtime — injected
`<script>` tags are subject to the page's CSP, `@require` is not.

**Chrome/Tampermonkey permission prerequisite (2026):** Tampermonkey
5.5.1+ requires the browser to authorize userscript execution separately.
In Chrome 138+, open `chrome://extensions` → Tampermonkey → **Details**,
then turn on **Allow User Scripts**. Older Chrome-based browsers may require
**Developer mode** in `chrome://extensions`. See the
[official Tampermonkey FAQ](https://www.tampermonkey.net/faq.php?q=Q209).
If the 🧠 menu and `[boredom-engine] ready` console message are both missing,
check this permission, the userscript's Enabled state and site access **before**
debugging individual YouTube selectors or media APIs.

**Auto-connect through file inclusion:**

1. Give Tampermonkey access to local files: chrome://extensions →
   Tampermonkey → **Details** → enable **Allow access to file URLs**. Newer
   Tampermonkey versions may additionally ask for **All Sites** permission when
   a script uses `file://` resources — grant it.
2. Load the generated userscript into Tampermonkey **from the file**:
   - Tampermonkey dashboard → **Utilities** → **Import from file** → select
     `dist/tampermonkey/boredom-engine.user.js`; or
   - drag-and-drop the `.user.js` onto the Tampermonkey dashboard; or
   - open the file directly in the browser
     (`file://.../boredom-engine/dist/tampermonkey/boredom-engine.user.js`) —
     Tampermonkey auto-detects `.user.js` files and offers to install them.
3. On a supported site, the bootstrap runs first, then the wrapped site
   scripts; only the current site's **enabled** scripts execute. Verify in the
   page console: `[boredom-engine] ready on <host> (site: <site>)`.

**After every `bun run build`**, re-import the `.user.js` (or open it in the
Tampermonkey dashboard → **Reload**/reinstall) so Tampermonkey re-reads the
`@require` files — they are read at install/update time, not per page load.
The `file://` paths are absolute and machine-specific, so each checkout needs
its own install.

### Control menu (🧠)

Every supported page gets a floating **🧠** button (bottom-right). Clicking it
opens a panel with:

- a **checkbox per intervention** of the current site — toggles persist; because
  `@require` scripts execute at load time, a toggle applies on the next page
  load (use the *reload now* link in the panel).

Intervention selections are persisted in `localStorage` (`boredom-engine:state`, keyed by
script `id`), so they survive page reloads and browser restarts.

### Control API (for LLMs / automation)

The loader exposes `window.__BOREDOM_ENGINE__` with a small, deterministic API:

```js
window.__BOREDOM_ENGINE__.getState()                    // { currentSite, enabled, scripts[] }
window.__BOREDOM_ENGINE__.getScripts()                  // [{ id, name, path, enabled }]
window.__BOREDOM_ENGINE__.enableScript("youtube_grayscale")   // persists; reload to apply
window.__BOREDOM_ENGINE__.disableScript("youtube_grayscale")  // persists; reload to apply
window.__BOREDOM_ENGINE__.toggleScript("youtube_grayscale")
window.__BOREDOM_ENGINE__.reload()                      // reload to apply a toggle
```

`getState()` returns the persisted state; `getScripts()` reports the current
host's scripts with their enabled flag. Script ids are the catalog's stable
`@id` values (the same keys ace-engine persists by).
Every mutation logs a `[boredom-engine]` line to the console.

### Config

`bootstrap.js` has a small `CONFIG` block at the top:

- `STORAGE_KEY` — the `localStorage` key for the persisted per-intervention state.
- `defaultEnabled` (catalog entry) — controls a script's default on/off state; explicit user preferences override it.

Notes:

- Scripts are loaded via `@require` and run in Tampermonkey's context, so page
  CSP does not block them. If a site script does not take effect, open the
  userscript in the dashboard and check that its `@require` files resolved
  (red entries) — usually a file-URL access permission issue.
- Usage statistics are not reported: tracking-script reporting was removed
  from the product and is no longer part of the resistance bundles.
- Rebuild with `bun run build`, then reload the userscript in Tampermonkey,
  whenever scripts or sites change.

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
