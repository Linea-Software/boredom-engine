# Browser smoke tests (Playwright)

Proof-of-harness for browser-level smoke tests of the resistance scripts
(release plan Step 5.4): mock pages + script injection + DOM-effect assertions.
The full ~40-script suite is a later phase — this directory establishes the
pattern.

## Running

```sh
bun run test:smoke   # from the boredom-engine root
```

Playwright's bundled chromium (revision 1234) must be installed once:

```sh
bunx playwright install chromium
```

## How it works

- `harness.ts` wraps `src/common/test-utils.ts` (esbuild in-memory bundling +
  `page.addInitScript` injection), sets `window.__BOREDOM_INTENSITY__`, and
  loads mock fixture pages via `page.setContent`.
- `fixtures/<site>/<name>.html` are minimal mock pages mirroring the real
  site's DOM for the elements a script targets.
- `<name>.spec.ts` asserts the script's DOM effect on the fixture.

No real network access is needed: fixtures are inlined and script sources are
bundled in memory.

## Adding a script (the remaining ~40)

1. Add `fixtures/<site>/<name>.html` with the minimal DOM the script targets.
2. Add `<name>.spec.ts`:

   ```ts
   import { expect, test } from "@playwright/test";
   import { join } from "node:path";
   import { loadScript, openFixture, setIntensity } from "./harness";

   const SCRIPT_SRC = join(process.cwd(), "src/sites/<site>/<name>.ts");

   test("<name> <effect>", async ({ page }) => {
       await setIntensity(page, "medium");
       await loadScript(page, SCRIPT_SRC);
       await openFixture(page, "<site>/<name>.html");
       // assert the expected DOM effect, e.g.:
       await expect(page.locator("#feed")).toBeHidden();
   });
   ```

   Tips: use `expect.poll(...)` for effects applied asynchronously (CSS
   injection, MutationObservers, intervals), and always assert a negative
   control (an element the script must NOT touch) where practical.
