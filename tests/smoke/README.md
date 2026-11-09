# Browser tests for independent interventions

All site scripts are exercised through Playwright/Chromium against local HTML fixtures; no third-party accounts or network access are required. The current suite tests the behavior of individually enabled scripts, **not global intensity levels**.

Run from the `boredom-engine` root:

```sh
bun run check
bun run build
bun run test:smoke
```

The harness in `tests/smoke/harness.ts` provides `loadScript`, `openFixture`, `openFixtureAt`, `stubMathRandom`, `stubReplaceState`, and `stubAudioContext`. Use a direct `loadScript(page, srcPath)` call before opening a fixture; the script represents an intervention explicitly enabled by the user.

## What is verified

- Each site's feed, navigation and recommendation removal leaves unrelated controls usable.
- Grayscale is deterministic, producing a complete grayscale effect with `saturate(0)` for affected media.
- Media quality, playback delays, buffering, scrolling caps, and CAPTCHA operate with fixed, documented parameters once enabled.
- No script relies on `window.__BOREDOM_INTENSITY__` or on changes to that variable.
- Direct ACE injection checks nonce-bearing script tags under strict CSP and YouTube's Trusted Types policy, without a Tampermonkey bootstrap.
- Probabilistic effects are made deterministic with `stubMathRandom`; asynchronous effects are checked with polling instead of relying on arbitrary sleeps.

The source metadata in each `src/sites/.../*.ts` defines the expected behavior; match tests to `@description` when a script changes. `tests/unit/tampermonkey.test.ts` verifies that the optional userscript loader honors independent on/off selections, default-off opt-in actions and persisted overrides. `tests/artifact.test.ts` verifies the ZIP and generated catalog.

Passing fixtures do not prove compatibility with a live site's latest DOM. Perform a separate verification in a browser before publishing a new content release.
