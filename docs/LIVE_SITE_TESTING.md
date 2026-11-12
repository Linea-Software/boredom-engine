# Live Site Testing

## Purpose

The offline Playwright smoke tests use HTML fixtures. They do not prove that an
intervention works on the current public website. The opt-in live runner tests
the actual site and a compiled production IIFE from `dist/normal/`.

Live tests use a baseline tab without intervention and a second tab with
exactly one intervention. Both tabs share one isolated Chrome profile.

The runner **does not** validate ACE's MITM proxy, CSP rewriting, installed
script version, or license checks. Test these separately with ACE before
publishing a release. Tampermonkey is not part of this runner.

## Start

Run from the `boredom-engine` directory:

```sh
bun install
bun run test:live --site youtube --script youtube_shorts_remove --headed
bun run test:live --site youtube --script youtube_grayscale --headed
bun run test:live --site reddit --script reddit_block_recomandations --headed
```

The runner calls `bun run build` before a test. It checks the catalog ID and
bundle path. It does not run the full offline suite. Run that suite separately.

The default browser uses a disposable Playwright Chromium profile. On YouTube,
the runner selects **Reject all** if Google shows the optional-cookie consent
dialog. It never selects Accept all, logs in, or solves an access challenge.
The grayscale check uses a public YouTube search page by default because a
logged-out home page can have no thumbnail images.

To test
content that needs a login, use a **separate test profile** and sign in by hand:

```sh
bun run test:live --site reddit --script reddit_block_recomandations \
  --headed --profile-dir .cache/live-chrome-reddit
```

A test profile can contain account data. Never commit it or reuse your daily
browser profile. The `.cache/` directory is ignored by Git. Do not automate
login, solve access challenges, or capture credentials.

To attach to a Chrome instance that you started with `bun run dev-chrome`:

```sh
bun run dev-chrome
bun run test:live --site youtube --script youtube_shorts_remove \
  --cdp-url http://127.0.0.1:9222
```

CDP is allowed only on loopback. **Only connect to a dedicated test Chrome.**
The runner creates and closes its own tabs; it does not change existing tabs.

To test a different page of the same site, use `--url`:

```sh
bun run test:live --site youtube --script youtube_grayscale \
  --url https://www.youtube.com/
```

Other options: `--timeout-ms 45000`, `--report-dir .cache/live-report`,
and `--skip-build`. The last option may use stale code. Run
`bun run test:live --help` to inspect all options.

## Results

A run writes `report.json`, `baseline.png`, and `script-enabled.png` to
`test-results/live/<script>-<timestamp>/` unless you set `--report-dir`.

Exit statuses:

| Exit | Status | Meaning |
| --- | --- | --- |
| 0 | passed | All checks passed on the real target site |
| 1 | failed / error | An assertion failed, or the runner could not execute |
| 2 | inconclusive | The target was absent, or site/browser access failed |

The runner verifies the baseline target first. It never calls a missing
element a passing removal. It also checks a primary navigation surface.
The YouTube Shorts scenario checks a direct Shorts route redirect.
The YouTube grayscale scenario checks the computed filter of a live image.

**Privacy:** Screenshots from a logged-in session may show private information.
Keep reports local. They are Git-ignored. Error reporting uses counts, not raw
request URLs, response bodies, cookies, browser storage or credentials.
Do not upload a report from a personal account without reviewing it.

## Add a scenario

1. Add the script ID, site and generated relative bundle path to
   `tests/live/options.ts` (`SCENARIOS`).
2. Add a verifier to `tests/live/scenarios.ts`. Inspect the target on a
   baseline page before testing removal or modification.
3. Check SPA routes, late loading, and unrelated navigation.
4. Mark missing targets **inconclusive**. Do not silently treat them as success.
5. Add a fixture regression test to `tests/smoke/` for confirmed DOM patterns.
6. Run `bun run check`, `bun run test`, `bun run test:smoke`,
   `bun run test:artifact`, then an opt-in live scenario.
7. Before release, run a real ACE proxy end-to-end check with the new content
   version. The live runner cannot replace that check.

Never make live site tests part of default CI: website DOM, geo gating, login
walls, and external network access can make runs nondeterministic. Record
pass, fail, and inconclusive separately.
