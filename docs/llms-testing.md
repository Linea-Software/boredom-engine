# Mission
Bug-fix and verify ALL Boredom Engine resistance scripts through a real browser,
using the Tampermonkey test loader in the `boredom-engine` repo. You work in the
repo's project directory (`C:\Projects\ace-project\boredom-engine`) and drive a
real Chrome tab through browser tools (browser_navigate, browser_snapshot,
browser_click, browser_get_text, browser_reload). Do NOT modify anything outside
`boredom-engine/`. Use `bun` for everything (never npm/pnpm/yarn).

# Context you need

## The system
- `src/sites/<reverse-domain>/<site>/<script>.ts` — 40 resistance scripts for 6
  sites: facebook.com, instagram.com, reddit.com, tiktok.com, twitch.tv,
  youtube.com (plus subdomains). Each file starts with a JSDoc block declaring
  `@id`, `@name`, `@description`, `@version` — treat those as the source of
  truth for what each script should do.
- `src/common/` — shared utilities. Scripts read the intensity from
  `window.__BOREDOM_INTENSITY__` (values: none/low/medium/high/extreme; default
  medium). Many scripts no-op at `none`.
- `bun run build` — rebuilds everything and regenerates the Tampermonkey test
  loader under `dist/tampermonkey/`:
  - `boredom-engine.user.js` — the userscript to install in Tampermonkey. It
    `@require`s local `file://` files (bootstrap first, then every wrapped
    site script).
  - `bootstrap.js` — loader core (state, API, menu).
  - `scripts/<site-path>` — site bundles wrapped in a guard so a script only
    executes when its site matches the current host AND it is enabled.
- `bun run test` / `bun run test:artifact` — unit + artifact suites. Keep them
  green (the catalog contract must not break).

## One-time setup (requires the human)
1. You: run `bun run build`.
2. Ask the human to: enable **Allow access to file URLs** for Tampermonkey
   (chrome://extensions → Tampermonkey → Details; grant "All Sites" if asked),
   then install `dist\tampermonkey\boredom-engine.user.js` via Tampermonkey →
   Utilities → Import from file (or drag-drop onto the dashboard).
3. **After EVERY `bun run build` you run, ask the human to reload the
   userscript in Tampermonkey** (dashboard → the script → Reload, or re-import
   the file). @require files are read at install/update time, NOT per page
   load. Wait for confirmation before re-verifying.

## How to verify a script is running
- On a supported site, a floating **🧠** button must appear (bottom-right) —
  that means `bootstrap.js` ran. Click it to open the panel: it shows an
  intensity selector (None/Low/Medium/High/Extreme) and a checkbox per script
  of the current site.
- Programmatic control (if your tooling can evaluate JS in the page):
  `window.__BOREDOM_ENGINE__` with `getState()`, `getScripts()`,
  `setIntensity(v)`, `enableScript(id)`, `disableScript(id)`, `toggleScript(id)`,
  `reload()`. State persists in localStorage under `boredom-engine:state`.
- The guard contract: on youtube.com ONLY `com/youtube/*` scripts run; facebook
  scripts must never run there, even if enabled.

# Procedure

## 1. Baseline pass
For each of the 6 sites:
1. `browser_navigate` to the site (e.g. https://www.youtube.com). Use public,
   login-free pages (home, trending, a video, an explore page) — these sites
   may require login; that's fine, test what's accessible.
2. Snapshot. Confirm: page loaded, **🧠 FAB present** (loader active), and the
   panel (after clicking 🧠) lists exactly that site's scripts.
3. Confirm NO cross-site leakage: only the current site's scripts are listed
   in the menu, and (when you can) that only its scripts take effect.
4. Record console errors: ask the human to open DevTools console and report any
   red errors mentioning `boredom-engine` or the site scripts, then reproduce
   the action that triggered them.

## 2. Per-script pass (the core of the job)
For every script of every site, using the menu (or API):
1. Disable all scripts of the site EXCEPT the one under test, reload, snapshot
   the baseline.
2. Enable the target script, reload, snapshot again.
3. Compare against the script's `@description`. Verify the effect is present
   (element removed/blocked, overlay/captcha injected, delay applied, etc.).
   NOTE: some effects are visual only (grayscale, desaturation, quality) and
   are NOT visible in text snapshots — for those, confirm the script loads and
   runs by toggling it and checking the page structure/behavior changes, and
   note "visual effect — human should eyeball" in the report.
4. Test intensity behavior for a representative sample per site: set `none`
   (annoyance scripts should stop), `medium` (default), `high`/`extreme`
   (effects escalate). Confirm the menu + API agree and state persists across
   reloads.
5. Check the page is still usable (no crash loops, no stuck overlays, no
   infinite captcha blocking navigation, timers/scroll still fine).
6. Restore all scripts to enabled at the end of each site.

## 3. Fix bugs you find
Define a bug as: script throws, doesn't apply its described effect, applies the
wrong effect, breaks page usability, runs on the wrong site (guard leak), or
misbehaves per intensity. For each bug:
1. Reproduce it first; note the exact page + state.
2. Fix in `src/sites/...` (keep JSDoc `@id`/`@name`/`@description`/`@version`
   intact — ids are persistence keys; don't rename casually).
3. `bun run build` + `bun run test` (unit). Do NOT change the catalog contract.
4. Ask the human to reload the userscript in Tampermonkey, then re-verify in
   the browser. Loop until fixed.
5. Commit with `git commit` using conventional commits (`fix:`, `feat:`,
   `refactor:`, `tests:`, `docs:`), subject under 50 chars. Do not commit
   `dist/` (it is gitignored).
Follow the repo conventions: small focused units, type safety (invalid states
unrepresentable), Bun for everything.

# Acceptance criteria
- All 40 scripts load and behave per their descriptions on their own sites.
- No cross-site script leakage anywhere.
- Intensity selector and per-script toggles work, persist, and apply on reload.
- No console errors from the loader or site scripts (human-verified).
- Page usability preserved; nothing breaks navigation.
- Unit + artifact tests green.

# Report back
- Per site: scripts checked, pass/fail counts, any login-gated checks that
  could only be partially verified.
- Issues found → fixes applied (with commit hashes).
- Remaining/unverifiable items (visual-only effects to eyeball, login-only
  areas), plus the exact steps a human should take to confirm them.
