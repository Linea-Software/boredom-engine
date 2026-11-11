# Browser Verification Guide

## Architecture

The `boredom-engine` catalog contains separate intervention scripts in `src/sites/<reverse-domain>/<site>/`.
Bun builds the scripts and packages them in `dist/resistance-scripts.zip`.
ACE Engine injects only interventions that the user enabled for the applicable site.
Each intervention has its own enabled state.
There is no intensity ladder, global level, or usage-tracking dependency.

The optional Tampermonkey adapter adds a control panel to the page.
The panel makes `window.__BOREDOM_ENGINE__` available.
Its API includes `getState()`, `getScripts()`, `enableScript(id)`, `disableScript(id)`, `toggleScript(id)`, and `reload()`.
The adapter stores selections in localStorage under `boredom-engine:state`.
Explicit selections take precedence over the catalog's `defaultEnabled` value.
Visual degradation and interruption scripts are disabled by default.

## Verification Procedure

1. Run `bun run check && bun run build && bun run test && bun run test:artifact && bun run test:smoke`.
2. For Tampermonkey tests, enable userscript execution and local-file access in Chrome.
3. Install or reload the generated userscript after each build.
4. Open each supported website.
5. Confirm that its control panel lists only scripts for that website.
6. Confirm that interventions for other websites do not run.
7. Disable all interventions for the current website. Reload the page.
8. Enable only one intervention. Reload the page again.
9. Confirm that the documented effect occurs.
10. Confirm that unrelated navigation and primary website functions still work.
11. For visual effects, inspect the rendered page. Do not use text snapshots as the only evidence.
12. Check elements that load late, SPA route changes, and late DOM targets.
13. Disable the intervention. Reload the page. Confirm that the effect is gone.
14. Confirm that script selections remain after reload. Include scripts with a default disabled state.
15. Confirm that a locked ACE configuration prevents users from disabling enabled interventions.
16. Confirm that the same locked configuration permits users to enable more interventions.
17. Restore the required website configuration.

Do not report an effect as verified without a usable live DOM.
Report any check blocked by login requirements or Content Security Policy (CSP).

## Test Report

For each website, record the checked scripts and the visible result.
Record pass or fail, console errors, and important test limits.
Keep existing `@id` values when you repair scripts.
ACE uses these IDs to store per-script overrides.
Before a release, run `bun run build` and verify the ZIP contract.
