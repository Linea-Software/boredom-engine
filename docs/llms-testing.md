# Browser verification guide

## Architecture

The `boredom-engine` catalog contains individual intervention scripts in `src/sites/<reverse-domain>/<site>/`. Scripts are bundled by Bun and shipped in `dist/resistance-scripts.zip`. ACE Engine injects **only the independently enabled interventions** on their matching site. There is no intensity ladder, global level, or usage-tracking dependency.

The optional Tampermonkey adapter builds an on-page control panel exposing `window.__BOREDOM_ENGINE__`. The API supports `getState()`, `getScripts()`, `enableScript(id)`, `disableScript(id)`, `toggleScript(id)` and `reload()`. Selection is persisted in localStorage under `boredom-engine:state`; explicit choices override the catalog `defaultEnabled` flag. Visual degradation and interruption scripts are opt-in.

## Procedure

1. Run `bun run check && bun run build && bun run test && bun run test:artifact && bun run test:smoke`.
2. If testing Tampermonkey, enable userscript execution and local-file access in Chrome; install or reload the generated userscript after every build.
3. On each supported website, verify that the control panel lists only scripts for that site and no cross-site intervention leaks.
4. Disable all interventions for the current site, reload, then enable **one** intervention and reload. Verify that its documented effect appears without unrelated changes to navigation or primary site features. For visual effects, inspect the actual rendered page; text snapshots alone are insufficient.
5. Check delayed elements, SPA route transitions and scripts whose DOM targets appear late. Verify that disabling an intervention and reloading removes its effects.
6. Test persistence of script choices, including scripts that default to off. Test that a locked ACE configuration forbids disabling an enabled intervention while still permitting additional interventions.
7. Restore the intended site configuration. Never describe an effect as verified if it was blocked by login, CSP or lack of a usable live DOM.

## Reporting

For each site, report which scripts were checked, what the user-visible change was, pass/fail, any console errors, and important limitations. Maintain stable `@id` keys when fixing scripts: ACE stores overrides by these IDs. Test the ZIP contract and run `bun run build` before releasing.
